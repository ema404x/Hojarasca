// 4.17.0 (B): ACTO III · capítulo 11 «El arco y la honda» (GUION_HISTORIA.md), primera parte: las dos cadenas de armas. Ocho escenas: el arco
// de Tito, las plumas (la micro-decisión que mueve el lazo de Josefina, tres escenas según de dónde vengan), los blancos del Puesto del Paso
// (`armas:arco`), las paces con Fermín, la honda y los blancos de la esquila (`armas:honda`). Lo prestado, la deuda, el recorrido y las
// optativas están en historia-escenas-acto3-c11b.js.
import { efectosDe, dlg, narra, linea, gs, plano, pose, aparece, camina, mira, desaparece, sonido, efecto, opcion, eleccion, siEleg, siDecision } from './historia-escenas-util.js';
import { FRENTE, apagon, hora, con, no, lazoAl } from './historia-escenas-acto2-util.js';
import { pj3, primerDe } from './historia-escenas-acto3-util.js';

const titoArco = {
  id: 'tito-arco', titulo: 'El arco de lenga', acto: 3, capitulo: 11,
  resumen: 'A la mañana, en la carpintería, Tito te dio el arco de lenga sin cuerda: flexible y terco, como la gente de acá. Te pidió que lo trataras como a un perro viejo.',
  personajes: pj3('tito', 'narra'),
  disparador: { hora: [7, 11] },
  pasos: [
    plano('detalle', 'tito', { desde: 'jugador', dist: 1.2, alto: 1.1, miraY: 1, dur: 3, mezcla: 0.9 }),
    pose('tito', 'serruchar', { dur: 2.4 }),
    narra('Las manos de Tito sacan viruta fina de un listón largo, curvo, oscuro. Tiene el olor dulce de la lenga recién cepillada, y las manos le saben antes de que la cabeza decida.'),
    plano('medio', 'tito', { desde: 'jugador', dist: 3.2, mezcla: 0.8, dur: 3 }),
    mira('tito', 'jugador'),
    con(dlg('tito', ['Dos tablas de coihue, de las que quedaron. La madera vuelve adonde tenía que ir. Con eso el arco sale con el alma buena.']), siDecision('coihue', 'b')),
    con(efecto('quitar:tabla-coihue:2'), siDecision('coihue', 'b')),
    dlg('tito', [
      linea('Lenga. Flexible y terca, como la gente de acá.', { gesto: gs('hacer-broma', 2) }),
      'No lo deje al sol ni lo deje en la nieve. Trátelo como a un perro viejo: con paciencia y sin hacerle trampa.',
    ]),
    plano('detalle', FRENTE(1.2), { desde: 'jugador', dist: 0.8, alto: 1.1, dur: 3, mezcla: 0.8 }),
    narra('Te entrega el arco sin cuerda. Pesa casi nada y vibra apenas en las manos, como un animal que todavía no se decidió a despertar.'),
    eleccion('arco-resp', '¿Qué le decís a Tito?', [
      opcion('gracias', 'Es el mejor arco que vi en mi vida.', { efecto: 'lazo:tito:1' }),
      opcion('cuerda', '¿Y la cuerda? ¿Quién la hace?', { sabor: true }),
      opcion('perro', '¿Un perro viejo? Entonces le pongo nombre.', { sabor: true }),
    ]),
    dlg('tito', [linea('Es el único que vio. Pero gracias, me hace bien oírlo.', { gesto: gs('hacer-broma', 2) })], { si: siEleg('arco-resp', 'gracias') }),
    dlg('tito', ['Elvira. La tejedora. Con vellón y cera hace una cuerda que aguanta la humedad. Hablá con ella, que es de pocas palabras y muchas puntadas.'], { si: siEleg('arco-resp', 'cuerda') }),
    dlg('tito', ['Cuando le ponga nombre, avíseme. Se lo grabo en la madera, en el lado de adentro, donde nadie vea.'], { si: siEleg('arco-resp', 'perro') }),
    efecto('mundo:arco-sin-cuerda'),
    efecto('raro:arco-de-lenga'),
  ],
};

const plumasBosque = {
  id: 'plumas-bosque', titulo: 'Plumas del bosque', acto: 3, capitulo: 11,
  resumen: 'Juntaste seis plumas del bosque para las flechas. Josefina te vio con ellas en la mano y te lo recordó con voz cansada: las plumas se quedan en el bosque.',
  personajes: pj3('josefina', 'narra'),
  pasos: [
    plano('medio', FRENTE(2.4), { desde: 'jugador', dist: 3.2, alto: 1.4, dur: 2.8, mezcla: 0.9 }),
    narra('Seis plumas pardas y grises, juntadas entre los coirones y los troncos, cada una con su brillito de escarcha. Las alisás entre los dedos, para que se acuerden de cómo era volar.'),
    aparece('josefina', FRENTE(5, 3)),
    camina('josefina', FRENTE(3, 1.4), { vel: 1.8, mira: 'jugador' }),
    plano('medio', 'josefina', { desde: 'jugador', mezcla: 0.7, dur: 30, sinEsperar: true }),
    dlg('josefina', [
      linea('Las plumas se quedan en el bosque. Te lo dije el primer día.', { gesto: gs('cruzarse', 2.4) }),
      'No es una regla mía: es del bosque. De ahí sacan los pájaros el abrigo para el invierno y los bichos el nido.',
    ]),
    eleccion('plumas-b-resp', '¿Qué le contestás?', [
      opcion('arco', 'Es para el arco. Lo necesitamos esta noche.', { sabor: true }),
      opcion('devolver', 'Tenés razón. Las devuelvo y busco otra manera.', { efecto: 'lazo:ema:1' }),
      opcion('callar', 'Me callo y las guardo.', { sabor: true }),
    ]),
    dlg('josefina', [linea('Ya sé para qué es. Por eso no te las saco de la mano. Pero lo anoto, ¿eh?', { gesto: gs('senalar', 2) })], { si: siEleg('plumas-b-resp', 'arco') }),
    dlg('josefina', ['Gracias. Después me contás de dónde sacás otras. Hay maneras, y no todas son malas.'], { si: siEleg('plumas-b-resp', 'devolver') }),
    dlg('josefina', ['Callado y todo, sigue siendo una pluma menos en el monte. Pero entiendo.'], { si: siEleg('plumas-b-resp', 'callar') }),
    con(efecto('quitar:pluma:6'), siEleg('plumas-b-resp', 'devolver')),
    efecto('lazo:ema:-1'),
    efecto('raro:plumas-del-bosque'),
  ],
};

const plumasGallinero = {
  id: 'plumas-gallinero', titulo: 'Plumas del gallinero', acto: 3, capitulo: 11,
  resumen: 'Juntaste seis plumas de tu gallinero para las flechas. Josefina, que andaba cerca, te miró las manos y se sorprendió: aprendiste.',
  personajes: pj3('josefina', 'narra'),
  pasos: [
    plano('medio', FRENTE(2.4), { desde: 'jugador', dist: 3.2, alto: 1.4, dur: 2.8, mezcla: 0.9 }),
    narra('En el gallinero hay plumas de todos los colores: blancas, marrones, una colorada. Las gallinas te miran juntar con cara de no entender el negocio.'),
    aparece('josefina', FRENTE(5, 3)),
    camina('josefina', FRENTE(3, 1.4), { vel: 1.8, mira: 'jugador' }),
    plano('medio', 'josefina', { desde: 'jugador', mezcla: 0.7, dur: 30, sinEsperar: true }),
    dlg('josefina', [
      linea('Mirá vos. Aprendiste.', { gesto: gs('aplaudir', 1.8) }),
      'Plumas de gallinero. Las gallinas ni se enteran, el monte tampoco. Eso sí es tratar bien al valle.',
    ]),
    eleccion('plumas-g-resp', '¿Qué le decís?', [
      opcion('gracias', 'Lo aprendí de vos.', { sabor: true }),
      opcion('gallinas', 'Las gallinas me miran mal.', { sabor: true }),
    ]),
    dlg('josefina', [linea('Entonces algo hice bien, aunque sea sin querer.', { gesto: gs('hacer-broma', 2) })], { si: siEleg('plumas-g-resp', 'gracias') }),
    dlg('josefina', ['Las gallinas miran mal a todo el mundo. Es su personalidad.'], { si: siEleg('plumas-g-resp', 'gallinas') }),
    efecto('lazo:ema:1'),
    efecto('raro:plumas-del-gallinero'),
  ],
};

const plumasJosefina = {
  id: 'plumas-josefina', titulo: 'La colección de la seccional', acto: 3, capitulo: 11,
  resumen: 'Le pediste plumas a Josefina. Te abrió la colección de la seccional: cada una tiene una ficha con dónde, cuándo y de qué ave. Una es de un cauquén del invierno pasado. Que sirva para algo.',
  personajes: pj3('josefina', 'narra'),
  pasos: [
    plano('medio', 'josefina', { desde: 'jugador', dist: 3.2, dur: 3, mezcla: 0.9 }),
    mira('josefina', 'jugador'),
    narra('La seccional huele a papel, a té y a estufa de leña. En un cajón con divisiones, ordenadas por tamaño, hay plumas en bolsitas de papel manteca, cada una con su etiqueta.'),
    dlg('josefina', [
      linea('Cada una tiene una ficha: dónde, cuándo, de qué.', { gesto: gs('leer', 2.4) }),
      'Todas son de aves que encontré muertas: nunca arranqué una pluma en quince años. Esta es de un cauquén del invierno pasado. Que sirva para algo.',
    ]),
    plano('detalle', FRENTE(1), { desde: 'jugador', dist: 0.8, alto: 1.1, dur: 3, mezcla: 0.8 }),
    narra('La etiqueta dice, con letra prolija: «Cauquén común. Junio. Lago. Hallado sin vida, sin signos de caza.» Debajo, a lápiz y más chico: «Lo enterré cerca del muelle.»'),
    eleccion('plumas-j-resp', '¿Qué le decís a Josefina?', [
      opcion('cuidar', 'Las cuido como si fueran tuyas.', { efecto: 'lazo:ema:1' }),
      opcion('fichas', 'Las fichas me las quedo para el cuaderno.', { sabor: true }),
    ]),
    dlg('josefina', [linea('Mejor: como si fueran del cauquén.', { gesto: gs('hacer-broma', 2) })], { si: siEleg('plumas-j-resp', 'cuidar') }),
    dlg('josefina', ['Copialas, dale. Pero que las fichas vuelvan. Son lo más valioso que tengo, aparte de la tablilla.'], { si: siEleg('plumas-j-resp', 'fichas') }),
    efecto('raro:plumas-de-la-seccional'),
  ],
};

const blancosPaso = {
  id: 'blancos-paso', titulo: 'Cinco blancos de paja', acto: 3, capitulo: 11,
  resumen: 'En el Puesto del Paso, Belisario puso cinco blancos de paja. Tensaste el arco, erraste los primeros y le pegaste a los últimos. Aplaudió y te pidió que no le disparases a las mulas. Ya tenés el arco.',
  personajes: pj3('belisario', 'narra'),
  pasos: [
    plano('general', FRENTE(14, 3), { desde: 'jugador', dist: 24, alto: 3.4, dur: 3.4, mezcla: 0.9 }),
    narra('Cinco blancos de paja trenzada, en fila, bajo la roca. Atrás, las mulas dormitan sin querer enterarse. Belisario los puso a distancias crecientes con una soga de pasos: diez, quince, veinte, veinticinco, treinta.'),
    aparece('belisario', FRENTE(5, 3)),
    plano('hombro', FRENTE(14), { desde: 'jugador', atras: 0.5, costado: 0.4, miraY: 1.2, mezcla: 0.9, dur: 3.4 }),
    narra('Tensás el arco con la cuerda de Elvira. La cuerda canta bajito. La primera flecha se va al pasto; la segunda toca el borde de la paja; la tercera, en cambio, se clava con un golpe sordo, casi en el medio.'),
    sonido('juntar'),
    plano('medio', 'belisario', { desde: 'jugador', dist: 3.4, mezcla: 0.8, dur: 30, sinEsperar: true }),
    dlg('belisario', [
      linea('¡Eso! Ahora no le dispare a mis mulas.', { gesto: gs('aplaudir', 2.2) }),
      'Mire que usted aprende de a poco, pero aprende. Eso en mi oficio vale más que tener puntería.',
    ]),
    eleccion('blancos-resp', '¿Qué le contestás a Belisario?', [
      opcion('mulas', 'A sus mulas las respeto demasiado.', { sabor: true }),
      opcion('mas', 'Dejeme tirar otra vuelta.', { sabor: true }),
      opcion('consejo', '¿Algún consejo para esta noche?', { sabor: true }),
    ]),
    dlg('belisario', ['Hace bien. Una mula ofendida es peor que un duende furioso.'], { si: siEleg('blancos-resp', 'mulas') }),
    dlg('belisario', ['Todas las que quiera, amigo. La paja es gratis. Yo cobro por mirar.'], { si: siEleg('blancos-resp', 'mas') }),
    dlg('belisario', ['Respire antes de soltar. El que tira apurado le pega al aire. El que tira tranquilo le pega a lo que quería.'], { si: siEleg('blancos-resp', 'consejo') }),
    efecto('armas:arco'),
    efecto('raro:arco-practicado'),
  ],
};

const ferminPaces = {
  id: 'fermin-paces', titulo: 'Hacer las paces con Fermín', acto: 3, capitulo: 11,
  resumen: 'Para que Fermín te enseñe la honda hubo que hacer las paces primero. Le llevaste algo que le gusta; él lo aceptó sin mirarte y, después de un rato largo, aflojó.',
  personajes: pj3('fermin', 'narra'),
  pasos: [
    plano('general', { lugar: 'galpon' }, { dist: 16, alto: 3.6, dur: 3.2, mezcla: 0.9 }),
    aparece('fermin', FRENTE(5, 2)),
    plano('medio', 'fermin', { desde: 'jugador', dist: 3.4, mezcla: 0.9, dur: 3 }),
    narra('Fermín está arreglando una alambrada con un alicate, de espaldas. Hace como que no te oyó llegar. Sabés que te oyó: tiene las orejas coloradas.'),
    eleccion('paces-resp', '¿Qué le llevás?', [
      opcion('harina', 'Una bolsa de harina del molino.', { sabor: true }),
      opcion('yerba', 'Yerba, de la buena.', { sabor: true }),
      opcion('pan', 'Pan casero, todavía tibio.', { sabor: true }),
    ]),
    con(efecto('quitar:harina:1'), siEleg('paces-resp', 'harina')),
    con(efecto('quitar:yerba:1'), siEleg('paces-resp', 'yerba')),
    con(efecto('quitar:pan-casero:1'), siEleg('paces-resp', 'pan')),
    con(narra('Dejás la bolsa de harina apoyada contra el poste. Pesa y se nota. Fermín la mira de reojo, la huele, y no se la devuelve.'), siEleg('paces-resp', 'harina')),
    con(narra('Dejás la yerba en el travesaño. Fermín la huele a la distancia, con una mueca de contento que él cree disimular.'), siEleg('paces-resp', 'yerba')),
    con(narra('Le tendés el pan tibio. Fermín deja el alicate, lo agarra, parte un cacho y se lo come de espaldas. Es la forma más educada que tiene de agradecer.'), siEleg('paces-resp', 'pan')),
    plano('primer', 'fermin', { desde: 'jugador', mezcla: 0.8, dur: 30, sinEsperar: true }),
    con(dlg('fermin', [
      linea('Lo de la majada no me lo voy a olvidar.', { gesto: gs('encogerse', 2.2) }),
      'Pero tampoco me lo voy a guardar en el pecho todo el invierno. Se me pudre.',
    ]), siDecision('majada', 'c')),
    con(dlg('fermin', [
      linea('Estuve enojado con usted. No sé bien por qué.', { gesto: gs('encogerse', 2.2) }),
      'Se hace difícil estar enojado con alguien que viene con pan.',
    ]), no(siDecision('majada', 'c'))),
    dlg('fermin', [linea('Venga mañana al galpón de esquila. Le enseño. Pero no se lo cuente a nadie.', { gesto: gs('senalar', 2) })]),
    efecto('lazo:fermin:1'),
    efecto('raro:paces-con-fermin'),
  ],
};

const ferminHonda = {
  id: 'fermin-honda', titulo: 'La honda no se apunta', acto: 3, capitulo: 11,
  resumen: 'En el galpón de esquila, con viento y la estepa blanca, Fermín te enseñó a tirar con la honda: no se apunta, se siente. Una lata voló de un poste. Si le llevaste la majada, te contó que Ramón fue a verla.',
  personajes: pj3('fermin', 'narra'),
  pasos: [
    plano('general', { lugar: 'galpon' }, { dist: 18, alto: 4, miraY: 2, dur: 3.6, mezcla: 0.9 }),
    narra('El viento de la estepa hace silbar la chapa del galpón. A lo lejos, el horizonte es una raya de nieve sucia. En los postes de la tranquera hay latas de duraznos alineadas, con el rótulo desteñido.'),
    aparece('fermin', FRENTE(5, 2.4)),
    plano('hombro', 'fermin', { desde: 'jugador', lado: 1, atras: 0.4, mezcla: 0.9, dur: 3.2 }),
    pose('fermin', 'brindar', { dur: 1.6 }),
    dlg('fermin', [
      linea('La honda no se apunta. Se siente.', { gesto: gs('mirar', 2) }),
      'Como cuando llamás al perro: no pensás, sale. Los ojos hacen la mitad y las manos la otra, y la cabeza se queda afuera.',
    ]),
    plano('detalle', 'fermin', { desde: 'jugador', dist: 1.2, alto: 1.4, miraY: 1.2, dur: 2.8, mezcla: 0.8 }),
    narra('Fermín revolea el cuero sobre su cabeza, una, dos, tres vueltas, en silencio. Suelta. Una lata salta del poste con un tin seco y rueda por la nieve.'),
    sonido('juntar'),
    con(dlg('fermin', [
      linea('Ramón vino ayer a ver la majada. En carro, con la cadera mala. Dijo que estaban flacas.', { gesto: gs('hacer-broma', 2.4) }),
      'No estaban flacas. Es su forma de decir gracias.',
    ]), siDecision('majada', 'a')),
    eleccion('honda-resp', '¿Qué le decís a Fermín?', [
      opcion('sentir', 'A ver si siento algo, entonces.', { sabor: true }),
      opcion('secreto', 'Tu secreto está a salvo conmigo.', { efecto: 'lazo:fermin:1' }),
      opcion('zorros', '¿Cuántos zorros espantaste así?', { sabor: true }),
    ]),
    dlg('fermin', ['Pruebe. Y si le sale mal, no se enoje: se enoja la piedra, no usted.'], { si: siEleg('honda-resp', 'sentir') }),
    dlg('fermin', [linea('Gracias. En el valle esas cosas cuestan más que la plata.', { gesto: gs('asentir', 2) })], { si: siEleg('honda-resp', 'secreto') }),
    dlg('fermin', ['Ninguno. Los espantaba. Si los hubiera tocado, Ramón me habría retado una semana.'], { si: siEleg('honda-resp', 'zorros') }),
    efecto('raro:honda-con-fermin'),
  ],
};

const blancosEsquila = {
  id: 'blancos-esquila', titulo: 'Cinco latas', acto: 3, capitulo: 11,
  resumen: 'Practicaste en los postes del galpón de esquila hasta voltear cinco latas con la honda. Fermín contó los aciertos en voz baja. Ya tenés la honda.',
  personajes: pj3('fermin', 'narra'),
  pasos: [
    plano('general', { lugar: 'galpon' }, { dist: 16, alto: 3.4, dur: 3, mezcla: 0.9 }),
    narra('Cinco latas en los postes del galpón. Tenés una honda de cuero trenzado en la mano y una bolsa de cantos redondos en el bolsillo. El viento sube y baja como si respirara.'),
    plano('hombro', FRENTE(12), { desde: 'jugador', atras: 0.5, costado: 0.4, miraY: 1.4, mezcla: 0.9, dur: 3.4 }),
    narra('Revoleás. El primer canto vuela alto, sobre las latas, y se pierde en la estepa. El segundo da en el poste. El tercero toca una lata, que baila pero no cae. El cuarto la tira. Después caen las demás casi sin que lo pienses.'),
    sonido('juntar'),
    aparece('fermin', FRENTE(5, 2.4)),
    plano('medio', 'fermin', { desde: 'jugador', dist: 3.4, mezcla: 0.8, dur: 30, sinEsperar: true }),
    dlg('fermin', [
      linea('Cinco. Y sin mirar el último.', { gesto: gs('aplaudir', 2) }),
      'Ya está. Eso se lleva en el brazo para siempre, como andar en bicicleta.',
    ]),
    eleccion('latas-resp', '¿Qué le decís a Fermín?', [
      opcion('suerte', 'Tuve suerte.', { sabor: true }),
      opcion('maestro', 'Tenés un buen maestro.', { sabor: true }),
      opcion('mas', '¿Y si aparecen cincuenta?', { sabor: true }),
    ]),
    dlg('fermin', ['La suerte no se repite cinco veces. Dígale a otro.'], { si: siEleg('latas-resp', 'suerte') }),
    dlg('fermin', [linea('Es el mejor maestro que tuve: yo mismo, a los diez años, contra los zorros.', { gesto: gs('hacer-broma', 2) })], { si: siEleg('latas-resp', 'maestro') }),
    dlg('fermin', ['Entonces los cincuenta van a recibir un canto cada uno. No me mire así. Es una broma. Más o menos.'], { si: siEleg('latas-resp', 'mas') }),
    efecto('armas:honda'),
    efecto('raro:honda-practicada'),
  ],
};

export const ESCENAS_C11 = {
  'tito-arco': titoArco,
  'plumas-bosque': plumasBosque,
  'plumas-gallinero': plumasGallinero,
  'plumas-josefina': plumasJosefina,
  'blancos-paso': blancosPaso,
  'fermin-paces': ferminPaces,
  'fermin-honda': ferminHonda,
  'blancos-esquila': blancosEsquila,
};
export const EFECTOS_C11 = [...new Set(Object.values(ESCENAS_C11).flatMap((e) => efectosDe(e)))].sort();
