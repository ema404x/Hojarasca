// 4.15.0 (B): las escenas del ACTO I de la Historia («El trato del molino», GUION_HISTORIA.md, capítulos 1 a 4), escritas como DATOS con el
// formato del motor de escenas (escenas.js, CAMBIOS_4_14_0.md). Hay 21, con los ids que dispara el agente A. Cada una trae planos de cámara,
// diálogos completos, respuestas del jugador (con su efecto o declaradas «de sabor») y las variantes según las decisiones.
//
// Cómo se leen:
//  · el anclaje de casi todas es `jugador` (o `{ frente: 'jugador', dist, lado }`): quien las dispara tiene que ponerlas con el jugador parado
//    donde ocurre (el umbral, el tocón, el alero, la mesa…). Dónde y cuándo está en `DISPARO_ACTO1`.
//  · los efectos siguen la convención de nombres de historia-escenas-util.js (lazo:ema:-1, decision:bolsa:a, raro:…, objeto:…, mundo:…).
//    La lista exacta que usa cada escena sale de `efectosDe(escena)`; `EFECTOS_ACTO1` es la de todas juntas.
//  · lo que tiene que valer aunque el jugador salte la escena va en pasos (no en el gesto o el plano de una línea): los efectos están en pasos.
//  · cada elección: o lleva `efecto`, o la opción dice `sabor: true` (cambia sólo el tono).
import { personajesDe, efectosDe, dlg, narra, linea, gs, hombro, plano, pose, aparece, camina, mira, desaparece, espera, sonido, efecto, opcion, eleccion, siEleg, siDecision, siEvento, siPresente } from './historia-escenas-util.js';

const FRENTE = (dist, lado = 0) => ({ frente: 'jugador', dist, lado });

// ---------------------------------------------------------------- CAPÍTULO 1 · La llave del molinero
const trochitaBoleto = {
  id: 'trochita-boleto', titulo: 'Boleto, pasajero', acto: 1, capitulo: 1,
  resumen: 'Elsa te cortó el boleto, le vio la llave a tu mochila y te contó que Eusebio, el último molinero, era raro y buena gente.',
  personajes: personajesDe('elsa'),
  disparador: { hora: [17, 20] },
  pasos: [
    plano('general', 'jugador', { dist: 16, alto: 4.5, giro: 70, dur: 2.6 }),
    aparece('elsa', FRENTE(7, 0.4)),
    plano('medio', 'elsa', { desde: 'jugador', mezcla: 0, dur: 1.2, sinEsperar: true }),
    camina('elsa', FRENTE(1.9, 0.6), { vel: 1.5, mira: 'jugador' }),
    dlg('elsa', [
      linea('¿Boleto, pasajero?', { gesto: gs('saludar', 1.6) }),
      '¿Hasta el Valle? Hace rato que no le corto uno a alguien con mochila de quedarse.',
      linea('Un momento… esa llave. Esa es la del refugio de Eusebio. Mire usted.', { gesto: gs('sorprenderse', 1.8), plano: hombro('elsa') }),
      'Cuarenta años moliendo para todo el valle, el hombre, y ahora la llave anda en tren.',
      linea('¿Sabe lo que decía? Que el molino no era de él. Que él nomás le daba de comer.', { gesto: gs('encogerse', 1.8) }),
      'Era raro Eusebio. Buena gente, pero raro.',
    ]),
    eleccion('trochita-pregunta', '¿Qué le contestás a Elsa?', [
      opcion('raro', '¿Raro cómo?', { sabor: true }),
      opcion('quedarme', 'Vengo a quedarme.', { sabor: true }),
    ]),
    dlg('elsa', [linea('Hablaba con los árboles. Bueno… todos hablamos con los árboles acá. Él esperaba que le contestaran.', { gesto: gs('barba', 1.8) })], { si: siEleg('trochita-pregunta', 'raro') }),
    dlg('elsa', [linea('Eso dicen todos en verano, pasajero. Yo lo anoto para el invierno.', { gesto: gs('hacer-broma', 1.8) })], { si: siEleg('trochita-pregunta', 'quedarme') }),
    dlg('elsa', ['Ya llegamos. Cuidado con el escalón, que es traicionero y no tiene ningún respeto por las mochilas.']),
  ],
};

const estacionLlegada = {
  id: 'estacion-llegada', titulo: 'La estación', acto: 1, capitulo: 1,
  resumen: 'Bajaste en la Estación del Valle. Elsa te indicó el camino: siga el agua y prenda fuego antes de que oscurezca.',
  personajes: personajesDe('elsa', 'narra'),
  disparador: { hora: [17.5, 20.5] },
  pasos: [
    plano('general', { lugar: 'estacion' }, { dist: 13, alto: 3.8, dur: 3.2 }),
    sonido('campana', { en: { lugar: 'estacion' } }),
    aparece('elsa', { lugar: 'estacion', dx: 3, dz: 2 }),
    plano('medio', 'elsa', { desde: 'jugador', mezcla: 1, dur: 1, sinEsperar: true }),
    pose('elsa', 'saludar', { dur: 1.8 }),
    dlg('elsa', [
      '¡Siga el agua! El refugio está donde el arroyo llega al lago.',
      'Y prenda fuego antes de que baje el sol, que acá la noche no pide permiso.',
    ]),
    eleccion('estacion-resp', '¿Qué le contestás?', [
      opcion('gracias', 'Gracias por todo, Elsa.', { sabor: true }),
      opcion('lena', '¿Con qué prendo el fuego?', { sabor: true }),
    ]),
    dlg('elsa', ['Me lo agradece en febrero, pasajero. Hoy vea que no se le haga de noche.'], { si: siEleg('estacion-resp', 'gracias') }),
    dlg('elsa', ['Con ramitas del suelo, que de eso sobra. Tres alcanzan para empezar. Y la tecla F en un claro: la madera no se prende sola.'], { si: siEleg('estacion-resp', 'lena') }),
    pose('elsa', 'saludar', { dur: 1.4 }),
    efecto('mundo:trochita-parte'),
    desaparece('elsa'),
    plano('general', { lugar: 'estacion' }, { dist: 14, alto: 4, dur: 2.8 }),
    narra('La trochita se va despacio, soltando vapor. El valle se queda sin ruido y de golpe se oye todo: el agua, un pájaro, tu propia mochila.'),
  ],
};

const algoCruza = {
  id: 'algo-cruza', titulo: 'Algo cruza', acto: 1, capitulo: 1,
  resumen: 'En el sendero, algo chico cruzó corriendo entre los helechos y se rió bajito. Quedó anotado en el cuaderno de lo raro.',
  personajes: personajesDe('narra'),
  disparador: { hora: [18, 21.5] },
  pasos: [
    // la mirada dirigida de la escena: la cámara sale de tu cabeza y mira sola hacia el helecho
    plano('hombro', FRENTE(15, 4), { desde: 'jugador', atras: 0, costado: 0, miraY: 0.4, alto: 1.65, mezcla: 0.9, dur: 3.9, sinEsperar: true }),
    espera(1),
    efecto('duende:pillo-cruza', { tipo: 'rastreador', desde: FRENTE(15, 5), hasta: FRENTE(14, -1), deEspaldas: true, rie: true }),
    espera(2.9),
    sonido('anotar'),
    efecto('raro:algo-cruzo'),
  ],
};

const notaEusebio = {
  id: 'nota-eusebio', titulo: 'La nota de Eusebio', acto: 1, capitulo: 1,
  resumen: 'Adentro del refugio, sobre la mesa, una foto de Eusebio con una bolsa de harina y una nota para quien llegara.',
  personajes: personajesDe('nota', 'narra'),
  pasos: [
    sonido('bisagra'),
    plano('general', 'jugador', { dist: 5, alto: 2.6, dur: 2.2 }),
    plano('detalle', FRENTE(1), { dur: 3, mezcla: 0.8 }),
    narra('Sobre la mesa hay una foto: un hombre flaco, con una bolsa de harina al hombro y cara de no querer salir en la foto. Al lado, una nota.'),
    efecto('objeto:foto-eusebio'),
    dlg('nota', [
      'Al que venga: la leña de adentro está húmeda y la de afuera no existe.',
      'La estufa tira si le hablás bajito. No toques el frasco de la repisa, que es masa madre de 1987. Y gracias. E. M.',
    ]),
    eleccion('nota-guardar', '¿Qué hacés con la nota?', [
      opcion('guardar', 'Guardarla: es de quien viva acá.', { efecto: 'objeto:nota-eusebio' }),
      opcion('dejar', 'Dejarla donde estaba. Ya se la sabe.', { sabor: true }),
    ]),
    narra('Alguien que escribe «y gracias» al final de una nota de leña no puede ser mala gente. Raro, quizás. Mala gente no.'),
    efecto('optativa:frasco-masa-madre'),
  ],
};

const rondaUmbral = {
  id: 'ronda-umbral', titulo: 'La ronda', acto: 1, capitulo: 1,
  resumen: 'A la mañana, las ramitas que sobraron estaban en ronda frente a la puerta, con un canto blanco en el medio. No había nadie.',
  personajes: personajesDe('narra'),
  disparador: { hora: [5.5, 10] },
  pasos: [
    efecto('mundo:ronda-ramitas', { donde: FRENTE(1.7) }),
    plano('picado', FRENTE(1.7), { dist: 2.8, alto: 6, dur: 3.6 }),
    narra('Las ramitas que te sobraron anoche están acomodadas en ronda, como las horas de un relojito. En el medio, un canto rodado blanco, liso como un huevo.'),
    plano('detalle', FRENTE(1.7), { dist: 0.9, dur: 2.6, mezcla: 0.8 }),
    plano('paneo', FRENTE(1.7), { hasta: FRENTE(24, -7), dist: 7, alto: 2.2, dur: 4.4, mezcla: 0.9 }),
    narra('Hacia el bosque, nada. La neblina del lago y un chucao que canta como si no hubiera pasado nada.'),
    efecto('raro:ronda-ramitas'),
    efecto('raro:canto-blanco'),
  ],
};

// ---------------------------------------------------------------- CAPÍTULO 2 · La bolsa del molinero
const ramonTranquera = {
  id: 'ramon-tranquera', titulo: 'Ramón en la tranquera', acto: 1, capitulo: 2,
  resumen: 'Don Ramón pasó con la majada, te pidió que cuidaras la casa de Eusebio y te mandó al almacén por el hacha.',
  personajes: personajesDe('ramon'),
  disparador: { hora: [7, 10] },
  pasos: [
    efecto('mundo:majada-pasa', { cerca: FRENTE(9, -3) }),
    plano('general', FRENTE(9, -3), { dist: 12, alto: 3.6, dur: 3.2 }),
    aparece('ramon', FRENTE(8, 3)),
    plano('medio', 'ramon', { desde: 'jugador', mezcla: 1, dur: 1, sinEsperar: true }),
    camina('ramon', FRENTE(2.4, 0.9), { vel: 1.1, mira: 'jugador' }),
    dlg('ramon', [
      linea('Así que vos sos el del aviso.', { gesto: gs('tomar-mate', 2) }),
      'Ercilia anduvo contando. A Ercilia le contás algo el lunes y el martes lo sabe Esquel.',
      linea('Eusebio era mi amigo. Callado, como yo. Bueno, más callado.', { gesto: gs('suspirar', 2), plano: hombro('ramon') }),
      "Cuidame la casa, m'hijo, que él la quería.",
    ]),
    eleccion('ramon-casa', '¿Qué le decís a Don Ramón?', [
      opcion('cuidar', 'La voy a cuidar, Don Ramón.', { sabor: true }),
      opcion('techo', 'Para empezar, el techo.', { sabor: true }),
    ]),
    dlg('ramon', [linea("Eso. Una casa es como un animal: si no la querés, se te enferma.", { gesto: gs('asentir', 1.6) })], { si: siEleg('ramon-casa', 'cuidar') }),
    dlg('ramon', [linea("El techo, sí. Mirá que llorar, llora.", { gesto: gs('senalar', 1.6) })], { si: siEleg('ramon-casa', 'techo') }),
    dlg('ramon', [
      'El hacha la cambia Ercilia en el almacén, en la aldea. Tomate la trochita.',
      'Y a la vuelta, el banco primero, que al lado del banco cada tronco rinde el doble.',
    ]),
    pose('ramon', 'saludar', { dur: 1.2 }),
    camina('ramon', FRENTE(14, -8), { vel: 1.3 }),
  ],
};

const almacenErcilia = {
  id: 'almacen-ercilia', titulo: 'El almacén', acto: 1, capitulo: 2,
  resumen: 'Ercilia te recibió con los brazos abiertos, te prometió el hacha por ramitas y cantos y te preguntó, bajito, si habías oído algo en lo de Eusebio.',
  personajes: personajesDe('ercilia', 'nelida'),
  pasos: [
    sonido('bisagra'),
    plano('medio', 'ercilia', { desde: 'jugador', dist: 3.6, dur: 3, mezcla: 0.8 }),
    mira('ercilia', 'jugador'),
    mira('nelida', 'jugador'),
    dlg('ercilia', [
      linea('¡Vos sos!', { gesto: gs('abrazar', 1.8) }),
      '¡Querido, pensé que no venía nadie! Bueno, pensé que venía uno de Buenos Aires con zapatillas blancas. Las tuyas están embarradas: buena señal.',
      'El hacha, sí. Dame unas ramitas y un par de cantos y es tuya.',
      linea('¿Y? ¿Dormiste bien en lo de Eusebio? ¿No… oíste nada?', { plano: { plano: 'primer', a: 'ercilia', desde: 'jugador', mezcla: 0.6, dur: 30, sinEsperar: true } }),
    ]),
    eleccion('almacen-oiste', '¿Qué le contestás?', [
      opcion('risa', 'Una risa, lejos.', { efecto: 'raro:risa-lejos' }),
      opcion('nada', 'Nada. Dormí como piedra.', { sabor: true }),
    ]),
    dlg('ercilia', [linea('Chimangos. O el viento en la chapa. Eso digo yo.', { gesto: gs('hacer-broma', 1.8) })], { si: siEleg('almacen-oiste', 'risa') }),
    dlg('nelida', ['Eso decimos.'], { si: siEleg('almacen-oiste', 'risa') }),
    dlg('ercilia', [linea('Mejor. Mejor así.', { gesto: gs('asentir', 1.4) })], { si: siEleg('almacen-oiste', 'nada') }),
    dlg('ercilia', [
      'Pasá por el mostrador cuando juntes lo que falta. Y ojo con el hacha: no viene afilada, viene con ganas.',
    ]),
    pose('ercilia', 'saludar', { dur: 1.2 }),
  ],
};

const eseNoJosefina = {
  id: 'ese-no-josefina', titulo: 'Ese no', acto: 1, capitulo: 2,
  resumen: 'Josefina, la guardaparque, te frenó antes del primer hachazo: ese árbol está vivo. Mejor el seco de al lado.',
  personajes: personajesDe('josefina'),
  pasos: [
    plano('hombro', FRENTE(6, -3), { desde: 'jugador', atras: 0, costado: 0, miraY: 1.1, alto: 1.65, mezcla: 0.9, dur: 1.8 }),
    aparece('josefina', FRENTE(9, -5)),
    plano('hombro', 'josefina', { desde: 'jugador', lado: 1, mezcla: 1, dur: 40, sinEsperar: true }),
    camina('josefina', FRENTE(3, -1.2), { vel: 1.9, mira: 'jugador' }),
    pose('josefina', 'cruzarse', { dur: 3 }),
    dlg('josefina', [
      'Ese no.',
      'El de al lado, que está seco. Ese da sombra a los renovales.',
      linea('Josefina, guardaparque. Vos sos el del refugio de Eusebio.', { gesto: gs('mirar', 2) }),
      'Ya veremos.',
    ]),
    eleccion('josefina-arbol', '¿Qué le decís?', [
      opcion('seco', 'Tenés razón. Voy por el seco.', { sabor: true }),
      opcion('porque', '¿Por qué ese no?', { sabor: true }),
      opcion('igual', 'Es un árbol solo. Uno más, uno menos.', { efecto: 'lazo:ema:-1' }),
    ]),
    dlg('josefina', [linea('Eso. Se agradece.', { gesto: gs('asentir', 1.4) })], { si: siEleg('josefina-arbol', 'seco') }),
    dlg('josefina', [
      'Porque cada pehuén y cada coihue vivo de acá es un nido, una sombra y quince años de lluvia guardada.',
      'El seco ya dio todo lo que tenía. Hacha para ese, sin culpa.',
    ], { si: siEleg('josefina-arbol', 'porque') }),
    dlg('josefina', [linea('Bueno. Ahora ya sé cómo sos.', { gesto: gs('negar', 1.6) })], { si: siEleg('josefina-arbol', 'igual') }),
    pose('josefina', 'senalar', { dur: 1.6 }),
    dlg('josefina', ['Si te hace falta madera, avisame. Hay de sobra, de la que se cae sola.'], { si: { eleccion: 'josefina-arbol', no: 'igual' } }),
    camina('josefina', FRENTE(14, 7), { vel: 1.7 }),
  ],
};

const bolsaAlero = {
  id: 'bolsa-alero', titulo: 'La bolsa', acto: 1, capitulo: 2,
  resumen: 'Arreglando el alero encontraste, atada con un piolín colorado, una bolsa de harina de Eusebio con una nota: para la raíz del coihue grande.',
  personajes: personajesDe('nota', 'narra'),
  pasos: [
    sonido('juntar'),
    // 4.17.0: el jugador queda a 2,3 m del alero (COLOCACION_ESCENA): la bolsa está ahí, no a un metro (la cámara miraba el pasto y después se pegaba al muro)
    plano('detalle', FRENTE(2.3), { dist: 1.7, alto: 1.7, miraY: 1.6, dur: 3, mezcla: 0.8 }),
    narra('Entre la chapa y la viga, envuelta en arpillera, hay una bolsa de harina atada con un piolín colorado. Y una nota, doblada en cuatro.'),
    plano('primer', FRENTE(2.3), { dist: 1.9, alto: 1.7, miraY: 1.6, dur: 2.2, mezcla: 0.6 }),
    efecto('objeto:bolsa-eusebio'),
    dlg('nota', [
      'Para la raíz del coihue grande del molino viejo, antes del primer frío.',
      'No te olvides, que ellos no se olvidan. Y gracias. E. M.',
    ]),
    narra('¿Ellos? La bolsa pesa lo que pesan diez kilos de harina buena. Tirarla no se puede. Guardarla en la despensa, tampoco: tiene un destino y una fecha.'),
    // 4.16.0: la opción de Rosa sólo se ofrece si Rosa ya vive en la aldea (si no, la pregunta tiene dos opciones)
    { ...eleccion('bolsa', '¿Qué hacés con la bolsa de Eusebio?', [
      opcion('a', 'Hacerle caso a la nota: llevarla a la raíz del coihue grande.', { efecto: 'decision:bolsa:a' }),
      opcion('b', 'Llevarla a Rosa, la panadera: pan para toda la aldea.', { efecto: 'decision:bolsa:b' }),
      opcion('c', 'Mostrarle la nota a Josefina: ella conoce la letra del valle.', { efecto: 'decision:bolsa:c' }),
    ]), si: siPresente('rosa') },
    { ...eleccion('bolsa', '¿Qué hacés con la bolsa de Eusebio?', [
      opcion('a', 'Hacerle caso a la nota: llevarla a la raíz del coihue grande.', { efecto: 'decision:bolsa:a' }),
      opcion('c', 'Mostrarle la nota a Josefina: ella conoce la letra del valle.', { efecto: 'decision:bolsa:c' }),
    ]), si: siPresente('rosa', true) },
    narra('Lo pensás un rato largo, con la bolsa en las manos. Cualquier cosa que hagas, la vas a tener que explicar.'),
  ],
};

const bolsaCoihue = {
  id: 'bolsa-coihue', titulo: 'La raíz del coihue', acto: 1, capitulo: 2,
  resumen: 'Dejaste la bolsa de Eusebio entre las raíces del coihue grande, como decía la nota. Al irte, ya no estaba. O fue la luz.',
  personajes: personajesDe('narra'),
  pasos: [
    efecto('decision:bolsa:a'),
    plano('medio', FRENTE(2.6), { desde: 'jugador', dist: 3.2, dur: 2.4, mezcla: 0.9 }),
    narra('Es un coihue enorme. En la base, entre dos raíces, hay un hueco justo para una bolsa. Alguien lo alisó con la mano hace mucho.'),
    sonido('juntar'),
    efecto('entrega:bolsa-eusebio'),
    narra('Dejás la bolsa con la nota debajo. «Para ellos», decís en voz baja, sin saber a quién. Te sentís un poco ridículo y bastante tranquilo.'),
    // al irte, la cámara se queda mirando la raíz, fija, 3 segundos
    plano('fijo', FRENTE(2.6), { desde: 'jugador', encuadre: 'general', dist: 7, alto: 2.2, dur: 3.2, mezcla: 0.9, sinEsperar: true }),
    espera(1.4),
    efecto('mundo:bolsa-se-pierde', { donde: FRENTE(2.6) }),
    espera(1.8),
    narra('La bolsa ya no está. O está y fue la luz, que a esta hora hace trampas entre las hojas. Vos preferís no preguntar.'),
    efecto('lazo:ramon:1'),
    efecto('raro:bolsa-raiz'),
  ],
};

const bolsaRosa = {
  id: 'bolsa-rosa', titulo: 'Pan para la aldea', acto: 1, capitulo: 2,
  resumen: 'Le llevaste la harina de Eusebio a Rosa, que prometió hornear pan para toda la aldea y te regaló unos panes tibios.',
  personajes: personajesDe('rosa'),
  pasos: [
    efecto('decision:bolsa:b'),
    plano('medio', 'rosa', { desde: 'jugador', dist: 3.2, dur: 3, mezcla: 0.9 }),
    mira('rosa', 'jugador'),
    efecto('entrega:bolsa-eusebio'),
    dlg('rosa', [
      linea('¡Harina de Eusebio!', { gesto: gs('amasar', 2), plano: { plano: 'primer', a: 'rosa', desde: 'jugador', mezcla: 0.7, dur: 30, sinEsperar: true } }),
      'Ésta es de la buena, de cuando molía despacio. Con esto hago pan para toda la aldea, ¿sabés lo que es eso? Ercilia va a llorar.',
      'Esperá, esperá. No te vayas con las manos vacías.',
    ]),
    efecto('dar:pan-casero:3'),
    sonido('juntar'),
    eleccion('rosa-pan', '¿Qué le decís?', [
      opcion('todos', 'Que alcance para todos.', { sabor: true }),
      opcion('mio', 'Guardame el del medio, que es el más tostado.', { sabor: true }),
    ]),
    dlg('rosa', [linea('Alcanza. Cuando la harina viene con buena intención, rinde el doble.', { gesto: gs('asentir', 1.6) })], { si: siEleg('rosa-pan', 'todos') }),
    dlg('rosa', [linea('Tenés ojo para el pan. El del medio es de la masa que más reposó.', { gesto: gs('senalar', 1.6) })], { si: siEleg('rosa-pan', 'mio') }),
    efecto('lazo:ercilia:2'),
    efecto('lazo:rosa:1'),
  ],
};

const bolsaJosefina = {
  id: 'bolsa-josefina', titulo: 'La letra de Eusebio', acto: 1, capitulo: 2,
  resumen: 'Josefina reconoció la letra de la nota: el abuelo de ella le llevaba el trigo a Eusebio. Se la quedó, y te dijo que algún día te cuenta.',
  personajes: personajesDe('josefina', 'narra'),
  pasos: [
    efecto('decision:bolsa:c'),
    plano('medio', 'josefina', { desde: 'jugador', dist: 3.2, dur: 2.8, mezcla: 0.9 }),
    mira('josefina', 'jugador'),
    efecto('entrega:bolsa-eusebio'),
    dlg('josefina', [
      '¿Qué es eso? ¿Dónde lo encontraste?',
    ]),
    eleccion('josefina-nota', '¿Qué le contestás?', [
      opcion('alero', 'Estaba en el alero del refugio, atada con un piolín.', { sabor: true }),
      opcion('letra', '¿Conocés esa letra?', { sabor: true }),
    ]),
    dlg('josefina', [
      linea('En el alero… claro. Donde nadie busca porque nadie sube.', { gesto: gs('pensar', 2) }),
      'Dejame ver.',
    ], { si: siEleg('josefina-nota', 'alero') }),
    dlg('josefina', ['Dejame ver, dejame ver.'], { si: siEleg('josefina-nota', 'letra') }),
    narra('Josefina lee la nota. Se queda un rato largo mirando una sola línea.'),
    dlg('josefina', [
      linea('Esta letra…', { gesto: gs('pensar', 2.4), plano: { plano: 'primer', a: 'josefina', desde: 'jugador', mezcla: 0.7, dur: 30, sinEsperar: true } }),
      'Mi abuelo le llevaba el trigo. Eusebio le escribía así, con la «g» para atrás.',
      'Dejámela. Por favor. Después te cuento. Algún día.',
    ]),
    efecto('lazo:ema:2'),
    efecto('raro:letra-eusebio'),
  ],
};

// ---------------------------------------------------------------- CAPÍTULO 3 · La mesa larga
const hachaTocon = {
  id: 'hacha-tocon', titulo: 'El hacha en el tocón', acto: 1, capitulo: 3,
  resumen: 'Tu hacha no estaba donde la dejaste: apareció clavada en el tocón del árbol seco, derechita, con una hoja de coihue en el mango.',
  personajes: personajesDe('narra'),
  disparador: { hora: [6.5, 12] },
  pasos: [
    efecto('mundo:hacha-en-tocon'),
    plano('general', FRENTE(5), { desde: 'jugador', dist: 9, alto: 3.2, dur: 3.2 }),
    narra('Tu hacha no está donde la dejaste. Está clavada en el tocón del árbol seco de ayer, derechita, con una hoja de coihue enganchada en el mango.'),
    plano('detalle', FRENTE(5), { desde: 'jugador', dist: 1.3, alto: 1.5, miraY: 1.35, dur: 3, mezcla: 0.9 }),   // (4.17.0: el tocón ahora es más alto: se mira el filo y la hoja del mango)
    narra('Una hoja verde, de las nuevas. Donde la hoja toca el mango, la madera está tibia, como si acabaran de soltarla.'),
    // el color según la decisión de la bolsa: piñones si la convidaste a la raíz, la cuchara arriba del techo si la hiciste pan
    { ...efecto('mundo:pinones-en-tocon', { donde: FRENTE(5) }), si: siDecision('bolsa', 'a') },
    { ...narra('Y sobre el tocón, un puñado de piñones, bien juntitos, puestos con pinza.'), si: siDecision('bolsa', 'a') },
    { ...efecto('mundo:cuchara-en-techo'), si: siDecision('bolsa', 'b') },
    { ...narra('Arriba, en el borde del techo del refugio, brilla tu cuchara de madera. Sin escalera, nadie sube ahí.'), si: siDecision('bolsa', 'b') },
    eleccion('hacha-pienso', '¿Qué pensás?', [
      opcion('zorro', 'Fue un zorro. Un zorro con manos.', { sabor: true }),
      opcion('broma', 'Alguien me está haciendo una broma.', { sabor: true }),
      opcion('adentro', 'Desde hoy el hacha duerme adentro.', { sabor: true }),
    ]),
    { ...narra('Los zorros no hacen eso, pero es más fácil decirlo.'), si: siEleg('hacha-pienso', 'zorro') },
    { ...narra('Una broma con muy buen pulso. Y muy bajita: ni el pasto quedó pisado.'), si: siEleg('hacha-pienso', 'broma') },
    { ...narra('Desde hoy el hacha duerme adentro. Con la puerta cerrada, por las dudas.'), si: siEleg('hacha-pienso', 'adentro') },
    efecto('raro:hacha-tocon'),
  ],
};

const placaHerminia = {
  id: 'placa-herminia', titulo: 'La placa del duende', acto: 1, capitulo: 3,
  resumen: 'Leíste la placa del duende de la plaza. Herminia te contó lo de las puertitas de los coihues y te preguntó qué hiciste con la bolsa de Eusebio.',
  personajes: personajesDe('herminia'),
  pasos: [
    plano('contrapicado', FRENTE(2.6), { desde: 'jugador', dist: 3.6, dur: 3, mezcla: 0.9 }),
    aparece('herminia', FRENTE(3.5, 2.6)),
    plano('paneo', FRENTE(2.6), { hasta: 'herminia', dist: 6, alto: 1.8, dur: 2.8, mezcla: 0.6 }),
    plano('medio', 'herminia', { desde: 'jugador', mezcla: 0.8, dur: 1, sinEsperar: true }),
    dlg('herminia', [
      linea('¿Leíste lo de abajo? «Golpeá antes de abrir».', { gesto: gs('reir', 1.8) }),
      linea('Lo puso el primer jefe de estación. Cuando tendían la vía, los peones encontraban puertitas talladas en las raíces de los coihues. Chiquitas así.', { gesto: gs('contar', 2.4) }),
      linea('Yo nunca vi uno, eh. Tampoco vi el viento, y el viento existe.', { gesto: gs('encogerse', 2) }),
      'Eusebio les dejaba harina. Todo el mundo sabía y nadie decía.',
      linea('¿Y vos qué hiciste con la bolsa?', { plano: { plano: 'primer', a: 'herminia', desde: 'jugador', mezcla: 0.7, dur: 30, sinEsperar: true } }),
    ]),
    dlg('herminia', [linea('Bien hecho. A donde se la dejaba él, ni más ni menos. Las costumbres son para respetarlas.', { gesto: gs('asentir', 1.6) })], { si: siDecision('bolsa', 'a') }),
    dlg('herminia', [linea('Pan para todos… también es una forma. Ya vas a ver qué piensan ellos.', { gesto: gs('barba', 1.8) })], { si: siDecision('bolsa', 'b') }),
    dlg('herminia', [linea('Josefina. Mirá vos. Esa chica lleva al abuelo adentro.', { gesto: gs('asentir', 1.6) })], { si: siDecision('bolsa', 'c') }),
    dlg('herminia', ['¿Todavía la tenés? Mirá que una bolsa vieja no espera para siempre. La harina se cansa de que la miren.'], { si: siDecision('bolsa', 'ninguna') }),
    eleccion('placa-creer', '¿Qué le decís?', [
      opcion('ver', 'Yo creo en lo que veo.', { sabor: true }),
      opcion('quiero', 'Me gustaría verlos alguna vez.', { sabor: true }),
    ]),
    dlg('herminia', [linea('Y yo en lo que no veo. Con eso nos llevamos bien las dos mitades del valle.', { gesto: gs('hacer-broma', 1.8) })], { si: siEleg('placa-creer', 'ver') }),
    dlg('herminia', [linea("Quedate quieto, m'hijo, y no mires fijo. Ellos ven mejor cuando uno no los busca.", { gesto: gs('susurrar', 2) })], { si: siEleg('placa-creer', 'quiero') }),
    efecto('raro:puertitas-peones'),
  ],
};

const mesaVisitaNicanor = {
  id: 'mesa-visita-nicanor', titulo: 'Nicanor en la mesa', acto: 1, capitulo: 3,
  resumen: 'Nicanor se sentó a tu mesa a tomar unos mates y te contó de las luces chiquitas que ve sobre el lago de noche.',
  personajes: personajesDe('nicanor'),
  disparador: { hora: [16, 19] },
  pasos: [
    plano('general', FRENTE(0.5), { desde: 'jugador', dist: 9, alto: 3, giro: 25, dur: 3.2 }),
    aparece('nicanor', FRENTE(2, 0.9)),
    plano('medio', 'nicanor', { desde: 'jugador', mezcla: 0.9, dur: 1, sinEsperar: true }),
    dlg('nicanor', [
      linea('Buenas, vecino. Qué mesa. Se nota que es nueva: todavía huele a pino.', { gesto: gs('tomar-mate', 2) }),
      'Y se ve que se asienta bien. Una mesa que no cojea es una mesa de gente que se queda.',
    ], { si: { cond: 'evento', args: { id: 'tobillo' }, no: true } }),
    dlg('nicanor', [
      linea('Buenas, vecino. Qué mesa. Y otra vez gracias por el tobillo: todavía me acuerdo cuando piso mal.', { gesto: gs('tomar-mate', 2) }),
    ], { si: siEvento('tobillo') }),
    eleccion('nicanor-charla', '¿De qué hablan?', [
      opcion('risas', 'Anoche oí risas, lejos.', { sabor: true }),
      opcion('lago', '¿Se ven cosas raras en el lago?', { sabor: true }),
      opcion('tiempo', 'Mejor hablemos del tiempo.', { sabor: true }),
    ]),
    dlg('nicanor', ['Del tiempo, ya. Mañana viento norte; pasado, viento norte con más ganas. ...Y luces en el lago, pero eso no es del tiempo.'], { si: siEleg('nicanor-charla', 'tiempo') }),
    dlg('nicanor', [
      linea('¿Risas de noche?', { gesto: gs('tomar-mate', 1.8), plano: hombro('nicanor', { lado: -1 }) }),
    ], { si: siEleg('nicanor-charla', 'risas') }),
    dlg('nicanor', [
      linea('Yo veo luces sobre el lago, y no digo nada porque después Aurelio se ríe.', { gesto: gs('barba', 2) }),
      'Luces chiquitas, que van y vienen. Como gente con farolitos. Muy petisa la gente.',
    ], { si: { eleccion: 'nicanor-charla', esUno: ['risas', 'lago'] } }),
    dlg('nicanor', ['Eso sí: desde que vivís acá, vienen más seguido. Será que les gusta el olor del pino.'], { si: { eleccion: 'nicanor-charla', esUno: ['risas', 'lago', 'tiempo'] } }),
    efecto('raro:luces-lago'),
  ],
};

const mesaVisitaRamon = {
  id: 'mesa-visita-ramon', titulo: 'Ramón en la mesa', acto: 1, capitulo: 3,
  resumen: "Don Ramón se sentó a tu mesa, te habló de «los vecinos de abajo» de Eusebio y te aconsejó dejar la puerta cerrada de noche. Por los zorros.",
  personajes: personajesDe('ramon'),
  disparador: { hora: [16, 19] },
  pasos: [
    plano('general', FRENTE(0.5), { desde: 'jugador', dist: 9, alto: 3, giro: -25, dur: 3.2 }),
    aparece('ramon', FRENTE(2, -0.9)),
    plano('medio', 'ramon', { desde: 'jugador', mezcla: 0.9, dur: 1, sinEsperar: true }),
    dlg('ramon', [
      linea("Buenas, m'hijo. Tenés mesa. Quien tiene mesa, recibe; y quien recibe, se queda.", { gesto: gs('tomar-mate', 2) }),
      linea('Eusebio decía «los vecinos de abajo».', { gesto: gs('barba', 2), plano: hombro('ramon', { lado: -1 }) }),
      'Yo le decía que eran los zorros. Él se reía.',
    ]),
    eleccion('ramon-vecinos', '¿Qué le decís?', [
      opcion('abajo', '¿Qué vecinos de abajo?', { sabor: true }),
      opcion('cerrada', 'Yo la puerta la dejo cerrada.', { sabor: true }),
    ]),
    dlg('ramon', [linea('Los zorros, m\'hijo. Los zorros.', { gesto: gs('mirar', 2) })], { si: siEleg('ramon-vecinos', 'abajo') }),
    dlg('ramon', ['Bien. Una puerta cerrada no ofende a nadie. Una abierta, depende quién pase.'], { si: siEleg('ramon-vecinos', 'cerrada') }),
    dlg('ramon', [
      linea('...', { gesto: gs('suspirar', 2.4) }),
      "Vos dejá la puerta cerrada de noche, igual. Por las dudas. Por los zorros.",
    ]),
    efecto('raro:vecinos-de-abajo'),
  ],
};

const ferminGalpon = {
  id: 'fermin-galpon', titulo: 'Fermín', acto: 1, capitulo: 3,
  resumen: 'En el galpón de esquila conociste a Fermín, que cuida las ovejas de Ramón «a medias» y no cree en duendes. Mira para la cordillera igual.',
  personajes: personajesDe('fermin'),
  pasos: [
    // 4.17.0: sobre Fermín, no sobre el centro del galpón (la cámara quedaba adentro del galpón)
    plano('general', 'fermin', { desde: 'jugador', dist: 14, alto: 3.4, miraY: 1.5, dur: 3.4 }),
    mira('fermin', 'jugador'),
    plano('medio', 'fermin', { desde: 'jugador', mezcla: 1.2, dur: 1, sinEsperar: true }),
    dlg('fermin', [
      linea('Las de la marca en la oreja son de Ramón. Las otras, mitad de él y mitad mías.', { gesto: gs('contar', 2.4) }),
      'Él dice que todas son mías y que me las presta. Ramón es así: te regala las cosas diciéndote que ya eran tuyas.',
    ]),
    eleccion('fermin-pregunta', '¿Qué le preguntás?', [
      opcion('duendes', 'Dicen que en el valle hay duendes.', { sabor: true }),
      opcion('oficio', '¿Hace mucho que cuidás ovejas?', { sabor: true }),
    ]),
    dlg('fermin', [
      linea('¿Duendes?', { gesto: gs('reir', 1.6) }),
      'Acá en la estepa no hay raíces, amigo. Acá hay viento.',
      linea('Arriba, en el paso, Belisario cuenta otras cosas. Pero Belisario cuenta muchas cosas.', { gesto: gs('senalar', 2) }),
    ], { si: siEleg('fermin-pregunta', 'duendes') }),
    dlg('fermin', [
      'Desde chico. Mi viejo ya les cuidaba el campo a otros. Yo siempre pensé que algún día iba a tener un puesto mío.',
      linea('...Pero bueno. Hoy hay que esquilar.', { gesto: gs('encogerse', 1.8) }),
    ], { si: siEleg('fermin-pregunta', 'oficio') }),
    dlg('fermin', ['Si pasás de vuelta con pan o con harina, no te voy a decir que no. Acá el horno es el sol, y no hornea nada.']),
    pose('fermin', 'saludar', { dur: 1.2 }),
    efecto('hablado:fermin'),
    efecto('optativa:fermin-pan'),
  ],
};

// ---------------------------------------------------------------- CAPÍTULO 4 · La señora del ramal
const andenGraciela = {
  id: 'anden-graciela', titulo: 'El andén', acto: 1, capitulo: 4,
  resumen: 'La ingeniera Graciela Pugh, de la Administración del Ramal, bajó a contar la carga del verano. Te dio hasta fin de verano para mostrarle que la vía mueve algo más que turistas.',
  personajes: personajesDe('elsa', 'graciela', 'ernesto'),
  disparador: { hora: [8, 11] },
  pasos: [
    plano('general', { lugar: 'estacion' }, { dist: 14, alto: 3.8, dur: 3.2 }),
    sonido('campana', { en: { lugar: 'estacion' } }),
    aparece('elsa', { lugar: 'estacion', dx: -3, dz: 3 }),
    aparece('ernesto', { lugar: 'estacion', dx: -9, dz: 7 }),
    aparece('graciela', { lugar: 'estacion', dx: 3, dz: -1 }, 'elsa'),
    plano('contrapicado', 'graciela', { desde: 'jugador', dist: 3.6, dur: 3, mezcla: 0.9 }),
    camina('graciela', FRENTE(3.4, 0.8), { vel: 1.5, mira: 'elsa' }),
    plano('medio', 'graciela', { desde: 'jugador', mezcla: 0.8, dur: 1, sinEsperar: true }),
    dlg('graciela', [
      linea('Graciela Pugh, Administración del Ramal.', { gesto: gs('saludar', 1.6) }),
      'Vengo a ver la carga del verano. Cuarenta toneladas por mes es lo que hace falta para que un ramal se pague. Ustedes cargan doce.',
    ]),
    plano('medio', 'elsa', { desde: 'jugador', mezcla: 0.5, dur: 30, sinEsperar: true }),
    dlg('elsa', [linea('Doce en verano. En invierno cargamos gente, que pesa menos pero vale más.', { gesto: gs('cruzarse', 2.4) })]),
    plano('medio', 'graciela', { desde: 'jugador', mezcla: 0.5, dur: 30, sinEsperar: true }),
    dlg('graciela', [
      'La gente no figura en la planilla, señora.',
      linea('¿Y usted? ¿Es del valle?', { gesto: gs('mirar', 1.8), plano: hombro('graciela') }),
    ]),
    eleccion('graciela-valle', '¿Qué le contestás a la ingeniera?', [
      opcion('dias', 'Desde hace cuatro días.', { sabor: true }),
      opcion('si', 'Sí.', { efecto: 'lazo:graciela:1' }),
      opcion('nose', 'Todavía no sé.', { efecto: 'lazo:guarda:-1' }),
    ]),
    dlg('graciela', ['Cuatro días. Es un récord de permanencia para esta planilla.'], { si: siEleg('graciela-valle', 'dias') }),
    dlg('graciela', ['Sin pensarlo. Qué raro. Se lo agradezco: la gente que se compromete rinde más que la que calcula.'], { si: siEleg('graciela-valle', 'si') }),
    dlg('graciela', ['Al menos es sincero. Anoto: «incierto».'], { si: siEleg('graciela-valle', 'nose') }),
    dlg('elsa', [linea('Ay, pasajero…', { gesto: gs('encogerse', 1.8) })], { si: siEleg('graciela-valle', 'nose') }),
    dlg('graciela', ['Bueno. Tiene hasta el fin del verano para mostrarme que esta vía mueve algo más que turistas.']),
    dlg('ernesto', ['Pase, ingeniera, que la campana ya tocó y la plaza queda para allá. Yo le llevo la valija.'], {}),
  ],
};

const cabinaElsa = {
  id: 'cabina-elsa', titulo: 'En la cabina', acto: 1, capitulo: 4,
  resumen: 'Elsa te enseñó a manejar la trochita: el regulador de a poco y a escuchar el tren. Graciela anotaba atrás.',
  personajes: personajesDe('elsa', 'graciela'),
  pasos: [
    aparece('elsa', FRENTE(0.6, 0.9)),
    aparece('graciela', FRENTE(-0.8, -0.8)),
    plano('hombro', FRENTE(40), { desde: 'jugador', atras: 0.1, costado: 0.2, miraY: 0.6, dur: 3, mezcla: 0.9 }),
    plano('medio', 'elsa', { desde: 'jugador', dist: 2.6, mezcla: 0.7, dur: 1, sinEsperar: true }),
    dlg('elsa', [
      linea('El regulador de a poco, que no es un auto. La tecla W acelera y la S frena.', { gesto: gs('senalar', 2) }),
      'Mi padre decía que el tren se maneja con las orejas: se escucha cuándo va cansado.',
    ]),
    eleccion('cabina-orejas', '¿Qué le decís?', [
      opcion('escuchar', 'Voy a escuchar.', { sabor: true }),
      opcion('nada', '¿Y si no escucho nada?', { sabor: true }),
    ]),
    dlg('elsa', [linea('Eso. Un tren bien manejado casi no se oye.', { gesto: gs('asentir', 1.6) })], { si: siEleg('cabina-orejas', 'escuchar') }),
    dlg('elsa', ['Entonces pare y espere. Un tren callado es peor que uno que se queja.'], { si: siEleg('cabina-orejas', 'nada') }),
    plano('medio', 'graciela', { desde: 'jugador', dist: 2.8, mezcla: 0.6, dur: 30, sinEsperar: true }),
    dlg('graciela', [
      linea('¿Siempre frenan con tanta… anticipación?', { gesto: gs('pensar', 2) }),
    ]),
    plano('medio', 'elsa', { desde: 'jugador', dist: 2.6, mezcla: 0.6, dur: 30, sinEsperar: true }),
    dlg('elsa', ['Siempre que queremos llegar, ingeniera.']),
    dlg('elsa', [linea('Ahora la vía es suya. Despacito, y escuche.', { gesto: gs('saludar', 1.4) })]),
  ],
};

const derrumbePuertita = {
  id: 'derrumbe-puertita', titulo: 'Piedras en la vía', acto: 1, capitulo: 4,
  resumen: 'Había piedras sobre la vía. Entre las últimas, enterrada en el ripio, una puertita de coihue del tamaño de una mano. Elsa te la dio a vos.',
  personajes: personajesDe('elsa', 'graciela', 'narra'),
  pasos: [
    plano('general', FRENTE(8), { desde: 'jugador', dist: 12, alto: 3.4, dur: 3, mezcla: 0.9 }),
    aparece('elsa', FRENTE(3, 1.2)),
    aparece('graciela', FRENTE(3.4, -1.2)),
    narra('Hay piedras sobre la vía. Bajaron de la ladera con la última lluvia. Graciela mira el reloj; Elsa ya se arremangó.'),
    eleccion('derrumbe-ayuda', '¿Qué hacés?', [
      opcion('ayudar', 'Bajar y ayudar a mover las piedras.', { sabor: true, a: 'ayuda' }),
      opcion('seguir', 'Rodear: el horario es el horario.', { efecto: 'lazo:graciela:-1', a: 'sigue' }),
    ]),
    // rama 1 (la de más abajo se corre sola si se ayuda): seguís de largo
    { ...dlg('graciela', [linea('¿Así se ayudan acá?', { gesto: gs('mirar', 1.8) })]), etiqueta: 'sigue' },
    dlg('elsa', [linea('Pasajero… la vía es de todos. Bueno. Seguimos.', { gesto: gs('encogerse', 1.8) })]),
    // la puertita aparece igual, apoyada contra tu puerta, a la noche
    efecto('mundo:puertita-a-la-noche', { donde: 'puerta-del-refugio' }),
    { tipo: 'salto', a: 'fin' },
    // rama 2: ayudás y la encontrás en la vía
    { ...narra('Piedra por piedra, entre los tres, la vía queda limpia. Elsa levanta la última, grande, y debajo, en el ripio, hay algo que no es una piedra.'), etiqueta: 'ayuda' },
    plano('detalle', FRENTE(3.4, -0.4), { desde: 'jugador', dist: 0.9, dur: 3, mezcla: 0.8 }),
    narra('Una puertita de madera de coihue, del tamaño de una mano. Con bisagra de cuero y una manijita de hueso. Está tibia.'),
    plano('medio', 'graciela', { desde: 'jugador', mezcla: 0.7, dur: 30, sinEsperar: true }),
    dlg('graciela', [
      linea('¿Y esto?', { gesto: gs('sorprenderse', 1.6) }),
      'Los chicos de la aldea, seguro. Juguetes.',
    ]),
    pose('elsa', 'susurrar', { dur: 2 }),
    narra('Elsa no contesta. Le saca la puertita de la mano a Graciela, despacio, y te la pone a vos en las tuyas.'),
    dlg('elsa', ['Guárdela usted. Usted vive en lo de Eusebio.']),
    efecto('objeto:puertita'),
    efecto('raro:puertita-via'),
    { ...espera(0.2), etiqueta: 'fin' },
  ],
};

const teGraciela = {
  id: 'te-graciela', titulo: 'La casa de té', acto: 1, capitulo: 4,
  resumen: 'En la casa de té, Graciela te contó que su abuelo era foguista en el ramal de Trevelin, el que cerraron, y te pidió que no se lo dijeras a Elsa.',
  personajes: personajesDe('graciela', 'narra'),
  pasos: [
    plano('general', FRENTE(2), { desde: 'jugador', dist: 8, alto: 2.8, dur: 3, mezcla: 0.9 }),
    aparece('graciela', FRENTE(2.2, 0.8)),
    plano('medio', 'graciela', { desde: 'jugador', mezcla: 0.9, dur: 1, sinEsperar: true }),
    dlg('graciela', [
      'Esto es bizcocho galés, ¿no? Mi abuelo traía uno en el bolsillo del mameluco y se le aplastaba. Lo comía igual.',
      linea('Mi abuelo era foguista. En el ramal de Trevelin, el que cerraron.', { gesto: gs('suspirar', 2.4), plano: { plano: 'primer', a: 'graciela', desde: 'jugador', mezcla: 0.8, dur: 30, sinEsperar: true } }),
      'No le cuente a Elsa, que se me ablanda.',
    ]),
    eleccion('te-graciela-resp', '¿Qué le decís?', [
      opcion('callar', 'Quédese tranquila: de mí no sale.', { sabor: true }),
      opcion('ramal', 'Entonces sabe lo que vale un ramal.', { sabor: true }),
    ]),
    dlg('graciela', [linea('Gracias. Tiene cara de saber guardar un secreto. Es una virtud rara en un valle con tanto viento.', { gesto: gs('hacer-broma', 1.8) })], { si: siEleg('te-graciela-resp', 'callar') }),
    dlg('graciela', ['Lo sé. Por eso lo hago con números: los números no se encariñan. Se supone.'], { si: siEleg('te-graciela-resp', 'ramal') }),
    efecto('lazo:graciela:2'),
    efecto('ramal:2'),
  ],
};

// ---------------------------------------------------------------- todas
export const ESCENAS_ACTO1 = {
  'trochita-boleto': trochitaBoleto,
  'estacion-llegada': estacionLlegada,
  'algo-cruza': algoCruza,
  'nota-eusebio': notaEusebio,
  'ronda-umbral': rondaUmbral,
  'ramon-tranquera': ramonTranquera,
  'almacen-ercilia': almacenErcilia,
  'ese-no-josefina': eseNoJosefina,
  'bolsa-alero': bolsaAlero,
  'bolsa-coihue': bolsaCoihue,
  'bolsa-rosa': bolsaRosa,
  'bolsa-josefina': bolsaJosefina,
  'hacha-tocon': hachaTocon,
  'placa-herminia': placaHerminia,
  'mesa-visita-nicanor': mesaVisitaNicanor,
  'mesa-visita-ramon': mesaVisitaRamon,
  'fermin-galpon': ferminGalpon,
  'anden-graciela': andenGraciela,
  'cabina-elsa': cabinaElsa,
  'derrumbe-puertita': derrumbePuertita,
  'te-graciela': teGraciela,
};
export const IDS_ACTO1 = Object.keys(ESCENAS_ACTO1);

// Todos los efectos que usan juntas (para registrar uno por uno en el aplicador de la historia)
export const EFECTOS_ACTO1 = [...new Set(Object.values(ESCENAS_ACTO1).flatMap((e) => efectosDe(e)))].sort();

// Dónde y cuándo se dispara cada una (para el agente que las engancha). `jugadorEn`: dónde tiene que estar parado el jugador, porque los
// planos se anclan a él. `objetivo`: el objetivo de capítulo que la cuenta como hecha (GUION_HISTORIA.md).
export const DISPARO_ACTO1 = {
  'trochita-boleto': { cap: 1, jugadorEn: 'sentado en la trochita, al arrancar la historia', cuando: '18:30, al empezar el capítulo 1 (Elsa pasa por el pasillo)', objetivo: null },
  'estacion-llegada': { cap: 1, jugadorEn: 'andén de la Estación del Valle', cuando: 'apenas termina trochita-boleto, 18:45', objetivo: null },
  'algo-cruza': { cap: 1, jugadorEn: 'sendero entre la estación y el refugio, a mitad de camino', cuando: 'al pasar el punto, al atardecer', objetivo: null },
  'nota-eusebio': { cap: 1, jugadorEn: 'adentro del refugio, junto a la mesa', cuando: 'al entrar con la llave', objetivo: 'abrí la puerta con la llave (escena nota-eusebio)' },
  'ronda-umbral': { cap: 1, jugadorEn: 'umbral del refugio', cuando: 'primera mañana, al salir', objetivo: 'mirá lo que hay en el umbral (objeto canto-blanco)' },
  'ramon-tranquera': { cap: 2, jugadorEn: 'frente al refugio, por la tranquera', cuando: '8:00 del día 2 (Ramón con la majada)', objetivo: 'hablá con Ramón (hablar ramon/alero)' },
  'almacen-ercilia': { cap: 2, jugadorEn: 'en la puerta del almacén de la aldea', cuando: 'primera vez que entrás al almacén en el capítulo 2', objetivo: null },
  'ese-no-josefina': { cap: 2, jugadorEn: 'bosque cerca del refugio, con el hacha en la mano frente a un árbol vivo', cuando: 'primer hachazo a un árbol vivo', objetivo: null },
  'bolsa-alero': { cap: 2, jugadorEn: 'alero del refugio', cuando: 'al cambiar la cuarta tabla del alero', objetivo: 'decisión «bolsa»' },
  'bolsa-coihue': { cap: 2, jugadorEn: 'al pie del coihue grande, junto al molino viejo', cuando: 'E en la raíz con la bolsa en la mochila', objetivo: 'cumplir D1 = a' },
  'bolsa-rosa': { cap: 2, jugadorEn: 'frente a Rosa, en la panadería', cuando: 'entregar la bolsa a la panadera', objetivo: 'cumplir D1 = b' },
  'bolsa-josefina': { cap: 2, jugadorEn: 'frente a Josefina (seccional o donde esté)', cuando: 'entregar la bolsa a Josefina', objetivo: 'cumplir D1 = c' },
  'hacha-tocon': { cap: 3, jugadorEn: 'a 5 m del último tocón talado, mirándolo', cuando: 'primera mañana del capítulo 3, al salir del refugio', objetivo: null },
  'placa-herminia': { cap: 3, jugadorEn: 'frente al duende tallado de la plaza, leyendo la placa (E)', cuando: 'al leer la placa', objetivo: 'leé la placa y hablá con Herminia (escena placa-herminia)' },
  'mesa-visita-nicanor': { cap: 3, jugadorEn: 'en tu mesa del refugio', cuando: 'primera visita, 16:00 a 19:00, si el visitante es Nicanor', objetivo: 'recibí una visita en tu mesa' },
  'mesa-visita-ramon': { cap: 3, jugadorEn: 'en tu mesa del refugio', cuando: 'primera visita, 16:00 a 19:00, si el visitante es Ramón', objetivo: 'recibí una visita en tu mesa' },
  'fermin-galpon': { cap: 3, jugadorEn: 'frente a Fermín, en el galpón de esquila', cuando: 'la primera charla con Fermín en el capítulo 3', objetivo: 'conocé a los vecinos (hablado fermin)' },
  'anden-graciela': { cap: 4, jugadorEn: 'andén de la Estación del Valle', cuando: 'llegar antes de las 11 del día 4', objetivo: 'recibí a la ingeniera (escena anden-graciela)' },
  'cabina-elsa': { cap: 4, jugadorEn: 'en la cabina de la locomotora, antes de manejar el primer tramo', cuando: 'subir a la cabina con Graciela y Elsa a bordo', objetivo: 'subí a la cabina y manejá un tramo' },
  'derrumbe-puertita': { cap: 4, jugadorEn: 'junto a las piedras sobre la vía', cuando: 'evento «derrumbe» durante el viaje con Graciela', objetivo: 'guardá la puertita en tu repisa (objeto puertita)' },
  'te-graciela': { cap: 4, jugadorEn: 'en la mesa de la casa de té de la aldea', cuando: 'optativa «Una vuelta para la ingeniera», segundo lugar', objetivo: null },
};
