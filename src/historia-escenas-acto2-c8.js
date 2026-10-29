// 4.16.0 (B): ACTO II · capítulo 8 «El cuaderno de Eusebio» (GUION_HISTORIA.md). Doce escenas como datos: las tres páginas del cuaderno,
// la libreta de Ercilia, el cuaderno del abuelo de Josefina, Belisario y «los del cerro», el secreto de Ramón y el fogón (la decisión D4,
// contar o callar). Optativas: la veta que vuelve (Tobías), las mulas (Belisario) y los noventa de Herminia.
import { efectosDe, dlg, narra, linea, gs, hombro, plano, pose, aparece, camina, mira, desaparece, espera, sonido, efecto, opcion, eleccion, siEleg, siDecision } from './historia-escenas-util.js';
import { pj, FRENTE, apagon, hora, con, no, lazoAl } from './historia-escenas-acto2-util.js';

const primerDe = (a, o = {}) => ({ plano: 'primer', a, desde: 'jugador', mezcla: 0.7, dur: 30, sinEsperar: true, ...o });
const hayTocon = siDecision('coihue', 'b');

// ---------------------------------------------------------------- las tres páginas del cuaderno
const cuaderno1 = {
  id: 'cuaderno-1', titulo: 'Cuentas y tratos', acto: 2, capitulo: 8,
  resumen: 'Leíste la primera parte del cuaderno de Eusebio: cuarenta años de bolsas, maquilas y nombres de vecinos que ya no están, con una anotación que no era de harina.',
  personajes: pj('cuaderno', 'narra'),
  pasos: [
    plano('detalle', FRENTE(1), { desde: 'jugador', dist: 0.8, alto: 1.2, dur: 3, mezcla: 0.9 }),
    narra('La letra es inclinada y apretada, de lápiz de carpintero. Las primeras hojas son de cuentas: fechas, bolsas, nombres. Cuarenta años de un oficio hecho a mano.'),
    dlg('cuaderno', [
      'Año de la nevada grande. Maquila de don Aníbal Salazar: tres bolsas. Pagó con un gallo, que me cantó todo el invierno. Y gracias.',
      'Maquila de la viuda de Prieto: ninguna, que la viuda no paga. La viuda es la que más me trae. Y gracias.',
      'Anoto lo que se debe y lo que se deja. Lo que se deja casi siempre vuelve. Lo que se debe casi nunca se cobra.',
    ]),
    plano('primer', FRENTE(1), { desde: 'jugador', dist: 1.1, alto: 1.4, miraY: 1.0, dur: 3, mezcla: 0.8 }),
    dlg('cuaderno', [
      'Ese invierno faltaron tres bolsas de la ronda. Aparecieron en el techo del galpón, atadas con una cinta colorada. No las bajé hasta que me hicieron señas de que se podía.',
    ]),
    eleccion('cuaderno1-resp', '¿Qué hacés con la página?', [
      opcion('seguir', 'Seguir leyendo.', { sabor: true }),
      opcion('marcar', 'Marcar la hoja de la cinta colorada.', { sabor: true }),
    ]),
    narra('Hay una cinta colorada pegada a la hoja, descolorida de tanto sol. Tiene la misma tonalidad que el piolín de la bolsa que encontraste en el alero.'),
    efecto('raro:cuaderno-cuentas'),
  ],
};

const cuaderno2 = {
  id: 'cuaderno-2', titulo: 'Puertitas y una lista', acto: 2, capitulo: 8,
  resumen: 'Segunda parte del cuaderno: dibujos de puertitas con medidas, y una lista titulada «lo que dejaron»: un canto blanco, piñones, una pluma de cóndor y la llave que Eusebio perdió en el 79.',
  personajes: pj('cuaderno', 'narra'),
  pasos: [
    plano('detalle', FRENTE(1), { desde: 'jugador', dist: 0.8, alto: 1.2, dur: 3, mezcla: 0.9 }),
    narra('Después de las cuentas empiezan los dibujos. A lápiz, de frente y de costado. Puertitas, tallas finas, con medidas escritas al lado. Algunas están sobre una raíz; una está sobre una piedra.'),
    dlg('cuaderno', [
      'Raíz de coihue, ancho de una mano. Raíz de pehuén, ancho de una palma. Con bisagra de cuero. Todas cierran para adentro, ninguna para afuera.',
    ]),
    plano('primer', FRENTE(1), { desde: 'jugador', dist: 1.1, alto: 1.4, miraY: 1.0, dur: 3, mezcla: 0.8 }),
    narra('En la hoja de al lado hay una lista, con un título subrayado: «Lo que dejaron».'),
    dlg('cuaderno', [
      'Un canto blanco, liso. Piñones, una mano llena. Una pluma de cóndor, larga como el antebrazo.',
      'La llave que perdí en el 79. La había perdido en el arroyo; me la devolvieron seca, con aceite. Y gracias.',
    ]),
    eleccion('cuaderno2-resp', '¿Qué pensás de la lista?', [
      opcion('canto', 'Tu canto blanco ya lo tengo en la repisa.', { sabor: true }),
      opcion('devolver', 'Ellos también te devolvían cosas.', { sabor: true }),
    ]),
    con(narra('El canto blanco del umbral, que dormía en tu repisa, ahora te parece un recibo. Un recibo de algo que todavía no sabés qué fue.'), siEleg('cuaderno2-resp', 'canto')),
    con(narra('Dejar y devolver. Es un idioma. Eusebio lo hablaba de corrido, sin diccionario.'), siEleg('cuaderno2-resp', 'devolver')),
    efecto('raro:lista-dejaron'),
  ],
};

const cuaderno3 = {
  id: 'cuaderno-3', titulo: 'La frase subrayada', acto: 2, capitulo: 8,
  resumen: 'Tercera parte del cuaderno: una frase subrayada dos veces sobre los del cerro, que bajan cuando la nieve tapa el paso, y una advertencia de Eusebio para el que venga después.',
  personajes: pj('cuaderno', 'narra'),
  pasos: [
    plano('detalle', FRENTE(1), { desde: 'jugador', dist: 0.8, alto: 1.2, dur: 3, mezcla: 0.9 }),
    narra('Casi al final, una frase subrayada dos veces. El lápiz casi rompió el papel.'),
    dlg('cuaderno', [
      'Cuando la nieve tapa el paso, los del cerro bajan. Los de abajo les tienen más miedo que nosotros.',
    ]),
    plano('primer', FRENTE(1), { desde: 'jugador', dist: 1.1, alto: 1.4, miraY: 1.0, dur: 3, mezcla: 0.8 }),
    dlg('cuaderno', [
      'Los del cerro no son malos. Tienen hambre y están lejos de casa, que en cualquiera es una mala combinación.',
      'Si alguna vez el trato se rompe, no culpes a los de abajo. Fijate quién cerró primero la puerta.',
    ]),
    eleccion('cuaderno3-resp', '¿Qué hacés con el cuaderno?', [
      opcion('releer', 'Releer la frase subrayada.', { sabor: true }),
      opcion('cerrar', 'Cerrarlo y guardarlo en la repisa.', { sabor: true }),
    ]),
    con(narra('La releés. La nieve, el paso, el miedo. Las palabras son sencillas; lo que traen atrás, no.'), siEleg('cuaderno3-resp', 'releer')),
    con(narra('Cerrás el cuaderno con las dos manos, como a algo que respira. En la repisa queda al lado del canto blanco. Parecen amigos.'), siEleg('cuaderno3-resp', 'cerrar')),
    efecto('raro:frase-del-cerro'),
  ],
};

// ---------------------------------------------------------------- las escenas del capítulo
const libretaFiado = {
  id: 'libreta-fiado', titulo: 'La libreta de fiado', acto: 2, capitulo: 8,
  resumen: 'En el almacén con la persiana a medio bajar, Ercilia admitió que el aviso del diario lo puso ella y te mostró la cuenta de «Los de la raíz», con la letra de Eusebio: «Debe: nada. Se les debe: una».',
  personajes: pj('ercilia', 'libreta', 'narra'),
  pasos: [
    sonido('bisagra'),
    plano('medio', 'ercilia', { desde: 'jugador', dist: 3, dur: 3, mezcla: 0.9 }),
    mira('ercilia', 'jugador'),
    dlg('ercilia', [
      linea('Te tengo que decir dos cosas, querido, y ninguna es fácil.', { gesto: gs('suspirar', 2.2) }),
      'La primera: el aviso del diario lo puse yo. La aldea se vacía. Hace tres años que no nace nadie. Pensé: si viene uno, vienen otros.',
      linea('La segunda…', { gesto: gs('senalar', 1.6) }),
    ]),
    plano('detalle', FRENTE(1), { desde: 'jugador', dist: 0.8, alto: 1.2, dur: 3.2, mezcla: 0.8 }),
    dlg('libreta', [
      'Los de la raíz. Debe: nada. Se les debe: una.',
    ]),
    plano('primer', 'ercilia', { desde: 'jugador', mezcla: 0.8, dur: 30, sinEsperar: true }),
    dlg('ercilia', [
      'Mirá esa cuenta. Con la letra de Eusebio. Cuarenta años mirándola y no sé qué se les debe.',
      'Mi abuela la dejó escrita. Mi madre me dijo: no la toques. Yo no la toqué. La miro cuando se me hace tarde.',
    ]),
    eleccion('libreta-resp', '¿Qué le contestás a Ercilia?', [
      opcion('gracias', 'Gracias por el aviso.', { efecto: 'lazo:ercilia:1' }),
      opcion('resto', 'Me podrías haber avisado del resto.', { sabor: true }),
      opcion('debe', '¿Y si lo que se les debe es una bolsa?', { sabor: true }),
    ]),
    dlg('ercilia', [linea('De nada, querido. Si te hubiera dicho todo, hubieras mirado el pasaje de vuelta.', { gesto: gs('hacer-broma', 2) })], { si: siEleg('libreta-resp', 'gracias') }),
    dlg('ercilia', [linea('¿Y venías?', { gesto: gs('cintura', 1.6) }), 'Eso pensé yo.'], { si: siEleg('libreta-resp', 'resto') }),
    dlg('ercilia', [linea('Una bolsa… Capaz. Eusebio dejaba una bolsa cada año, creo. Pero una cuenta no es una bolsa: una cuenta es una promesa.', { gesto: gs('pensar', 2.4) })], { si: siEleg('libreta-resp', 'debe') }),
    efecto('raro:libreta-raiz'),
  ],
};

const cuadernoAbuelo = {
  id: 'cuaderno-abuelo', titulo: 'El cuaderno del abuelo', acto: 2, capitulo: 8,
  resumen: 'En la seccional, Josefina sacó de abajo del escritorio el cuaderno de tapas de tela de su abuelo, con dibujos de puertitas en las raíces y sus medidas, y te contó por qué nunca se lo había mostrado a nadie.',
  personajes: pj('josefina', 'narra'),
  disparador: { hora: [14, 19] },
  pasos: [
    plano('medio', 'josefina', { desde: 'jugador', dist: 3.4, dur: 3, mezcla: 0.9 }),
    mira('josefina', 'jugador'),
    con(dlg('josefina', ['Ya te hablé del trigo y de la nota de Eusebio. Falta lo que más me cuesta.']), siDecision('bolsa', 'c')),
    narra('Josefina se agacha, saca una caja de abajo del escritorio y, de la caja, un cuaderno de tapas de tela, gastadas en las puntas.'),
    plano('detalle', FRENTE(1), { desde: 'jugador', dist: 0.8, alto: 1.2, dur: 3.4, mezcla: 0.8 }),
    narra('A lápiz, con regla, dibujos de puertitas en las raíces de los árboles. Al lado de cada una, medidas, la fecha y el tipo de madera.'),
    plano('medio', 'josefina', { desde: 'jugador', mezcla: 0.8, dur: 30, sinEsperar: true }),
    dlg('josefina', [
      linea('No se lo mostré a nadie. Ni a Julia.', { gesto: gs('suspirar', 2.2) }),
      'Soy bióloga. Si digo «duendes» en una reunión de parques, me mandan a contar choiques a la estepa.',
      linea('Pero mirá: mi abuelo medía las puertitas. Ancho, alto, de qué madera. Tenía método. Era más científico que yo.', { gesto: gs('hacer-broma', 2.4) }),
    ]),
    plano('hombro', 'josefina', { desde: 'jugador', lado: 1, mezcla: 0.7, dur: 30, sinEsperar: true }),
    dlg('josefina', [
      linea('Y si esto se sabe, viene gente con linternas a romper raíces.', { gesto: gs('cruzarse', 2.4) }),
      'Por eso lo cuido. Por eso los cuido. A ellos y al bosque. Es lo mismo.',
    ]),
    eleccion('abuelo-resp', '¿Qué le decís a Josefina?', [
      opcion('cuidar', 'Se puede cuidar sin esconder.', { sabor: true }),
      opcion('secreto', 'De mí no sale. Te lo prometo.', { efecto: 'lazo:ema:1' }),
      opcion('mirar', 'Mostrame el cuaderno entero, de a poco.', { sabor: true }),
    ]),
    dlg('josefina', [linea('Eso mismo pienso. Y no sé cómo se hace. Si lo sabés, avisame.', { gesto: gs('pensar', 2) })], { si: siEleg('abuelo-resp', 'cuidar') }),
    dlg('josefina', [linea('Te creo. Quince años aprendiendo a no creer a nadie y a vos te creo. Qué fastidio.', { gesto: gs('hacer-broma', 2) })], { si: siEleg('abuelo-resp', 'secreto') }),
    dlg('josefina', ['De a poco, sí. Una hoja por visita. Si te lo muestro todo de golpe, me arrepiento.'], { si: siEleg('abuelo-resp', 'mirar') }),
    efecto('raro:cuaderno-abuelo'),
  ],
};

const losDelCerro = {
  id: 'los-del-cerro', titulo: 'Los del cerro', acto: 2, capitulo: 8,
  resumen: 'En el Puesto del Paso, Belisario te contó de «los del cerro»: más viejos, más grandes, con barba de liquen, que bajan cuando la nieve tapa el paso, y a quienes los chiquitos de las raíces les disparan. Te dejó un recado para Fermín.',
  personajes: pj('belisario', 'narra'),
  pasos: [
    plano('general', FRENTE(8, 4), { desde: 'jugador', dist: 20, alto: 5.5, miraY: 5, dur: 3.6, mezcla: 0.9 }),
    narra('El paso se abre entre dos paredes de roca, con la cordillera nevada arriba. Un fogón chico, tres mulas atadas al fondo que bufan sin ganas, y un hombre sentado de espaldas al viento.'),
    mira('belisario', 'jugador'),
    plano('medio', 'belisario', { desde: 'jugador', dist: 3.6, mezcla: 0.9, dur: 1, sinEsperar: true }),
    dlg('belisario', [
      linea('Usted pregunta por los del cerro.', { gesto: gs('barba', 2.2) }),
      'Mire, mi amigo: yo crucé ese paso doscientas veces con mulas. Las mulas no se espantan por nada. Por los del cerro, sí.',
      'Son más viejos. Más grandes. Con barba como liquen. Cuando la nieve tapa el paso no tienen qué comer y bajan.',
    ]),
    plano('hombro', 'belisario', { desde: 'jugador', lado: -1, mezcla: 0.7, dur: 30, sinEsperar: true }),
    dlg('belisario', [
      linea('Los chiquitos de las raíces, los de ustedes, les disparan.', { gesto: gs('encogerse', 2) }),
      'Eusebio decía que el molino los tenía lejos. No sé si por la harina o por el ruido.',
    ]),
    eleccion('cerro-resp', '¿Qué le contestás a Belisario?', [
      opcion('miedo', '¿Usted les tiene miedo?', { sabor: true }),
      opcion('ruido', 'Entonces el molino tiene que seguir andando.', { sabor: true }),
      opcion('gracias', 'Gracias por contarme. No es fácil decirlo.', { efecto: 'lazo:belisario:1' }),
    ]),
    dlg('belisario', [linea('Miedo, no. Respeto. Que es la forma de miedo que le sale más barata a un arriero.', { gesto: gs('hacer-broma', 2) })], { si: siEleg('cerro-resp', 'miedo') }),
    dlg('belisario', ['Eso. Que muela, que muela. Una muela callada es un mal presagio, y yo de eso entiendo poco pero lo siento mucho.'], { si: siEleg('cerro-resp', 'ruido') }),
    dlg('belisario', [linea('A usted se le puede contar. A otros les dan risa estas cosas.', { gesto: gs('asentir', 1.8) })], { si: siEleg('cerro-resp', 'gracias') }),
    dlg('belisario', ['Y dígale a Fermín que mi oferta sigue. Las mulas no esperan, pero yo sí, un poquito.']),
    efecto('raro:los-del-cerro'),
  ],
};

const secretoRamon = {
  id: 'secreto-ramon', titulo: 'El secreto de Ramón', acto: 2, capitulo: 8,
  resumen: 'Al atardecer, en el banco de la puerta del Puesto Alto, Ramón te contó el invierno de la ceniza y los piñones que alguien le dejaba en la puerta. Si no te lleváis bien, solo lo ves de lejos, dejando yerba en una raíz.',
  personajes: pj('ramon', 'narra'),
  disparador: { hora: [17, 20] },
  pasos: [
    plano('general', FRENTE(10, -3), { desde: 'jugador', dist: 16, alto: 3, dur: 3.4, mezcla: 0.9 }),
    narra('El valle se tiñó de colorado. Las lengas, el pasto, hasta el humo de la chimenea. Parece un cuadro de alguien que se acordaba mucho.'),
    aparece('ramon', FRENTE(5, -2)),
    // con buen lazo: el relato
    con(plano('primer', 'ramon', { desde: 'jugador', dist: 1.5, alto: 1.6, mezcla: 0.9, dur: 1, sinEsperar: true }), lazoAl('ramon', 0)),
    con(dlg('ramon', [
      linea('El invierno de la ceniza no había pasto.', { gesto: gs('tomar-mate', 2.2) }),
      'Las ovejas se morían paradas. Y una mañana, en la puerta, piñones. Y la otra. Y la otra. Un mes.',
      'Les di piñones a las ovejas tostados en la estufa, y pasamos.',
      linea('Nunca supe quién. Nunca di las gracias.', { gesto: gs('suspirar', 2.8) }),
      'Por eso dejo la yerba. Es poco. Es lo que hay.',
      linea("No le cuentes a nadie, m'hijo. Que después Belisario se ríe.", { gesto: gs('hacer-broma', 2) }),
    ]), lazoAl('ramon', 0)),
    con(eleccion('ramon-resp', '¿Qué le decís a Don Ramón?', [
      opcion('callar', 'De mí no sale, Don Ramón.', { efecto: 'lazo:ramon:1' }),
      opcion('yerba', 'Yo la vi, la yerba en la raíz.', { sabor: true }),
      opcion('gracias', 'Quien sea, ya sabe que se lo agradecés.', { sabor: true }),
    ]), lazoAl('ramon', 0)),
    con(dlg('ramon', [linea('Bien. Entre dos viejos se guarda mejor. ...Bueno, uno viejo y uno que viene a serlo.', { gesto: gs('hacer-broma', 2) })]), siEleg('ramon-resp', 'callar')),
    con(dlg('ramon', ['¿La viste? Se me escapa todo con las rodillas.']), siEleg('ramon-resp', 'yerba')),
    con(dlg('ramon', ["Se lo agradezco cada vez. Cada vez que dejo la yerba. Capaz no hace falta decirlo en voz alta, m'hijo."]), siEleg('ramon-resp', 'gracias')),
    // con mal lazo: de lejos
    con(narra('Lo ves de lejos, junto a una raíz de pehuén, en la ladera. Se agacha, deja algo, se queda un rato con la boina en la mano. No se acerca a nadie. Vos tampoco.'), no(lazoAl('ramon', 0))),
    con(narra('Tendrías que haberle hablado antes, cuando se podía. Algunas cosas se cuentan solo a quien ya se ganó el banco de la puerta.'), no(lazoAl('ramon', 0))),
    con(desaparece('ramon'), no(lazoAl('ramon', 0))),
    con(efecto('raro:secreto-ceniza'), lazoAl('ramon', 0)),
    con(efecto('raro:ramon-de-lejos'), no(lazoAl('ramon', 0))),
  ],
};

const fogonLeyenda = {
  id: 'fogon-leyenda', titulo: 'El fogón de la leyenda', acto: 2, capitulo: 8,
  resumen: 'En el fogón de la aldea, con media aldea alrededor y los tres cuadernos en las manos, decidiste qué hacer con lo que sabés de los duendes: contarlo a todos, callarlo entre los que ya saben, o que Josefina lo mande a la universidad.',
  personajes: pj('herminia', 'nahuel', 'lucia', 'graciela', 'josefina', 'ramon', 'ercilia', 'cuaderno', 'narra'),
  disparador: { hora: [20.5, 23] },
  pasos: [
    ...apagon([
      hora(21, { dur: 0 }),
      efecto('mundo:fogon-leyenda', { donde: FRENTE(6) }),
      aparece('herminia', FRENTE(6, 3), 'jugador'),
      aparece('nahuel', FRENTE(5, -2.4), 'jugador'),
      aparece('lucia', FRENTE(5.4, -3.2), 'jugador'),
      aparece('graciela', FRENTE(7, -4), 'jugador'),
      aparece('josefina', FRENTE(8, 2), 'jugador'),
      aparece('ramon', FRENTE(7.6, 5), 'jugador'),
      aparece('ercilia', FRENTE(8.5, -1), 'jugador'),
    ], { dur: 2 }),
    plano('general', FRENTE(6), { desde: 'jugador', dist: 14, alto: 3.2, dur: 3.6, mezcla: 0.9 }),
    narra('El fogón de la aldea tira chispas hacia las estrellas. Hay media aldea sentada en círculo, con mantas y mates. Las caras se ven naranjas.'),
    plano('paneo', 'herminia', { hasta: 'ramon', dist: 8, alto: 1.8, dur: 4.4, mezcla: 0.9 }),
    narra('Ercilia con una taza. Graciela con su libreta en las rodillas. Josefina un poco aparte. Ramón con el mate, sin mirar a nadie. Nahuel y Lucía, sentados casi adentro del fuego.'),
    dlg('herminia', [
      linea('Dicen que traés algo. Dicen muchas cosas en este valle, pero esta vez dicen tres cuadernos.', { gesto: gs('mirar', 2.2) }),
      '¿Y? ¿Qué se cuenta esta noche?',
    ]),
    narra('Tenés en las manos el cuaderno de Eusebio, la libreta de Ercilia en la memoria y el cuaderno del abuelo de Josefina en la conciencia. Cualquier camino es un camino de ida.'),
    eleccion('cuaderno', '¿Qué hacés con lo que sabés de los duendes?', [
      opcion('a', 'Contarlo en el fogón, para toda la aldea.', { efecto: 'decision:cuaderno:a' }),
      opcion('b', 'Guardarlo entre los que ya saben.', { efecto: 'decision:cuaderno:b' }),
      opcion('c', 'Que Josefina lo mande a la universidad de Bariloche.', { efecto: 'decision:cuaderno:c' }),
    ], 1),
    // A: contar
    con(narra('Abrís el cuaderno de Eusebio y leés, con voz que no es la tuya, la primera página. El fuego te hace de apuntador.'), siEleg('cuaderno', 'a')),
    con(dlg('cuaderno', ['Al que tenga la llave. Si estás leyendo esto, ellos te lo dieron, y yo no estoy. No les tengas miedo, pero tampoco les tengas confianza: tené trato. El trato es así: el molino muele para todos los del valle. Para todos. Y gracias.']), siEleg('cuaderno', 'a')),
    con(dlg('herminia', [linea('¡Por fin alguien lo dice en voz alta!', { gesto: gs('aplaudir', 2.2) }), 'Ochenta y nueve años esperando.']), siEleg('cuaderno', 'a')),
    con(dlg('nahuel', ['¿Se puede ver el dibujo de las puertitas?']), siEleg('cuaderno', 'a')),
    con(dlg('lucia', ['¿Y a ellos se los puede saludar? ¿Con la mano o con la cabeza?']), siEleg('cuaderno', 'a')),
    con(narra('Graciela anota con una rapidez que da miedo. Ercilia llora un poco y lo disimula con la taza. Josefina se levanta antes del final y se va hacia la oscuridad, sin hacer ruido.'), siEleg('cuaderno', 'a')),
    con(camina('josefina', FRENTE(20, 9), { vel: 1.8 }), siEleg('cuaderno', 'a')),
    // B: callar
    con(narra('Cerrás el cuaderno. Contás otra cosa: una de las leyendas de siempre, la que todos conocen y les gusta oír de nuevo. Las leyendas viejas cubren las nuevas como la nieve cubre un camino.'), siEleg('cuaderno', 'b')),
    con(pose('josefina', 'asentir', { dur: 1.8 }), siEleg('cuaderno', 'b')),
    con(narra('Josefina, al lado, asiente apenas. Es el asentimiento más pequeño que viste. Al terminar, Ramón te pasa el mate sin decir nada. Está lavado, pero caliente. Es un honor.'), siEleg('cuaderno', 'b')),
    // C: universidad
    con(dlg('josefina', [
      linea('Hay un lugar en este valle que merece quedar registrado como sitio. Un árbol notable, de los que se cuidan por ley.', { gesto: gs('senalar', 2.4) }),
      'No digo más. Pero hay gente en la universidad de Bariloche que sabe cómo se hace sin que llegue una caravana de linternas.',
    ]), siEleg('cuaderno', 'c')),
    con(dlg('graciela', [linea('Un sitio protegido junto al ramal… Eso sí figura en la planilla.', { gesto: gs('contar', 2.2) })]), siEleg('cuaderno', 'c')),
    con(narra('Ercilia aplaude con los dedos, sin hacer ruido. Herminia asiente. Josefina mira el fuego como si se le acabara de ablandar algo en el pecho.'), siEleg('cuaderno', 'c')),
    plano('general', FRENTE(6), { desde: 'jugador', dist: 15, alto: 4, dur: 3.2, mezcla: 0.9 }),
    narra('La noche sigue, el fuego baja, y alguien, en algún lado, empieza a cantar bajito. Una canción vieja, de las que no tienen dueño.'),
    // los lazos de la rama elegida
    con(efecto('lazo:ercilia:2'), siEleg('cuaderno', 'a')),
    con(efecto('lazo:herminia:1'), siEleg('cuaderno', 'a')),
    con(efecto('lazo:ema:-1'), siEleg('cuaderno', 'a')),
    con(efecto('lazo:ema:2'), siEleg('cuaderno', 'b')),
    con(efecto('lazo:ramon:1'), siEleg('cuaderno', 'b')),
    con(efecto('lazo:ema:1'), siEleg('cuaderno', 'c')),
    con(efecto('lazo:graciela:1'), siEleg('cuaderno', 'c')),
    con(efecto('ramal:1'), siEleg('cuaderno', 'c')),
    efecto('raro:fogon-leyenda'),
  ],
};

const plumaUmbral = {
  id: 'pluma-umbral', titulo: 'Una pluma en el umbral', acto: 2, capitulo: 8,
  resumen: 'Esa noche, de vuelta del fogón, apoyada en el umbral del refugio había una pluma de cóndor, larga como un antebrazo, la misma que figura en la lista de Eusebio.',
  personajes: pj('narra'),
  disparador: { hora: [23, 26] },
  pasos: [
    efecto('mundo:pluma-en-umbral', { donde: FRENTE(2) }),
    plano('general', FRENTE(2), { desde: 'jugador', dist: 9, alto: 2.6, dur: 3, mezcla: 0.9 }),
    narra('El valle, de vuelta del fogón, está lleno de ruidos chiquitos: hojas, agua, algo que corre. Ya no te dan miedo. Te dan otra cosa, más difícil de nombrar.'),
    plano('detalle', FRENTE(2), { desde: 'jugador', dist: 0.9, alto: 0.7, dur: 3, mezcla: 0.9 }),
    narra('En el umbral, apoyada contra la puerta, hay una pluma negra, larga como un antebrazo, con la punta blanca. En la lista de Eusebio está escrita con letra clara: «una pluma de cóndor».'),
    eleccion('pluma-resp', '¿Qué hacés con la pluma?', [
      opcion('repisa', 'Ponerla en la repisa, al lado del canto blanco.', { sabor: true }),
      opcion('mirar', 'Mirar el cielo, por si alguien la dejó al pasar.', { sabor: true }),
    ]),
    con(narra('En la repisa queda bien, entre el canto, la puertita y el cuaderno. Parece un museo de cosas que no se pueden explicar.'), siEleg('pluma-resp', 'repisa')),
    con(narra('Arriba, nada. Las estrellas son tantas que cuesta ver el negro. Pero la pluma sigue tibia entre tus dedos, y eso ya es una respuesta.'), siEleg('pluma-resp', 'mirar')),
    efecto('objeto:pluma-condor'),
    plano('picado', FRENTE(2), { desde: 'jugador', dist: 4, alto: 8, dur: 3, mezcla: 0.9 }),
    efecto('mundo:nieve-alta'),
    narra('En la cordillera, arriba de todo, cayó la primera nieve. Desde acá se la ve brillar un segundo, nada más.'),
    efecto('raro:pluma-condor'),
  ],
};

const vetaVuelve = {
  id: 'veta-vuelve', titulo: 'La veta que vuelve', acto: 2, capitulo: 8,
  resumen: 'De noche, en la cantera, Tobías te mostró una veta de piedra que alguien rellenó con cantos blancos como el de tu umbral. Te dejó llevarte diez para la honda.',
  personajes: pj('tobias', 'narra'),
  disparador: { hora: [21, 25] },
  pasos: [
    ...apagon([hora(21.1, { dur: 0 })], { dur: 2 }),   // (4.17.0: a las 22:24 la cantera era un cuadro negro; a las 21 todavía queda un poco de cielo)
    plano('general', FRENTE(8, -3), { desde: 'jugador', dist: 14, alto: 4, dur: 3.2, mezcla: 0.9 }),
    narra('La cantera de noche es otro lugar: sin el ruido de la maceta, la piedra deja oír cómo se enfría. Tobías te espera con un farol bajo, sentado en un cajón.'),
    plano('medio', 'tobias', { desde: 'jugador', dist: 3.4, mezcla: 0.9, dur: 1, sinEsperar: true }),
    dlg('tobias', [
      linea('Mire. Esta es la veta que le saqué anteayer.', { gesto: gs('senalar', 2) }),
      'Hoy a la tarde estaba vacía. Ahora mire.',
    ]),
    efecto('mundo:cantos-veta', { donde: FRENTE(3.4, 1) }),
    plano('detalle', FRENTE(3.4, 1), { desde: 'jugador', dist: 1, alto: 1, dur: 3.2, mezcla: 0.8 }),
    narra('El hueco de la pared está lleno otra vez. Pero no de piedra de cantera: de cantos rodados, blancos, lisos como huevos. Los mismos que el de tu umbral. Los acomodaron de a uno.'),
    dlg('tobias', [
      linea('¿Qué le dije? Alguien la rellena de noche.', { gesto: gs('hacer-broma', 2) }),
      'Llévese diez. Para la honda, si es que usted piensa tirar algún día. Y los que dejen, dejan.',
    ]),
    eleccion('veta-resp', '¿Qué hacés con los cantos?', [
      opcion('diez', 'Llevarme los diez, agradecido.', { sabor: true }),
      opcion('dejar', 'Dejarlos: lo que se deja, vuelve.', { sabor: true }),
    ]),
    con(dlg('tobias', [linea('Diolch. Gracias, quiero decir. Mi abuela decía las dos.', { gesto: gs('asentir', 1.8) })]), siEleg('veta-resp', 'diez')),
    con(dlg('tobias', ['Eso es de Eusebio. Está bien. Pero algún día los vas a necesitar. Los dejo aparte, por las dudas.']), siEleg('veta-resp', 'dejar')),
    efecto('objeto:cantos-blancos'),
    efecto('lazo:tobias:1'),
    efecto('raro:veta-vuelve'),
  ],
};

const mulasBelisario = {
  id: 'mulas-belisario', titulo: 'Las mulas de Belisario', acto: 2, capitulo: 8,
  resumen: 'Acompañaste a caballo la tropa de mulas de Belisario hasta el mallín. Belisario te contó que el zaino es hijo de la yegua «mansa» que le vendió a Ramón.',
  personajes: pj('belisario', 'narra'),
  pasos: [
    efecto('mundo:tropa-mulas', { hasta: { lugar: 'mallin' } }),
    plano('travelling', 'belisario', { desde: 'jugador', dist: 5, alto: 2, lado: 1, dur: 3.4, sinEsperar: true }),
    aparece('belisario', FRENTE(5, 2)),
    camina('belisario', { lugar: 'mallin', dx: 6, dz: 4 }, { vel: 1.8 }),
    plano('general', { lugar: 'mallin' }, { dist: 16, alto: 3.6, dur: 3.2, mezcla: 0.9 }),
    narra('Siete mulas en fila, con la carga bien atada, y vos en el zaino, al final, como cola de cometa. El zaino camina más derecho de lo que recordabas. Sabe quién lo mira.'),
    plano('medio', 'belisario', { desde: 'jugador', mezcla: 0.9, dur: 1, sinEsperar: true }),
    dlg('belisario', [
      linea('Mire cómo marcha. Eso es de buena sangre.', { gesto: gs('senalar', 2) }),
      'El zaino es hijo de la yegua que le vendí a Ramón. La «mansa». Salió más manso que la madre y más bruto que el padre. Lo mejor de los dos mundos.',
      'Cuando termina la zafra, le cuento cómo fue el negocio de verdad. Ramón no lo sabe. Ni falta que hace.',
    ]),
    eleccion('mulas-resp', '¿Qué le contestás a Belisario?', [
      opcion('ramon', 'Ramón me dijo que usted lo había engañado.', { sabor: true }),
      opcion('mulas', '¿Cómo hacen las mulas para no espantarse?', { sabor: true }),
    ]),
    dlg('belisario', [linea('¿Engañar? Yo lo asesoré. El engaño es una cuestión de punto de vista.', { gesto: gs('hacer-broma', 2) })], { si: siEleg('mulas-resp', 'ramon') }),
    dlg('belisario', ['Con paciencia. Y con pan duro. Sobre todo con pan duro.'], { si: siEleg('mulas-resp', 'mulas') }),
    efecto('lazo:belisario:1'),
    efecto('raro:zaino-yegua'),
  ],
};

const herminiaNoventa = {
  id: 'herminia-noventa', titulo: 'Los noventa de Herminia', acto: 2, capitulo: 8,
  resumen: 'Le llevaste una torta a Herminia por sus noventa años. Ella te regaló «la llavecita», una llave de bronce chiquita que encontró de nena en una raíz.',
  personajes: pj('herminia', 'narra'),
  pasos: [
    plano('medio', 'herminia', { desde: 'jugador', dist: 3.4, dur: 3, mezcla: 0.9 }),
    mira('herminia', 'jugador'),
    dlg('herminia', [
      linea('¿Una torta? ¿Para mí?', { gesto: gs('sorprenderse', 1.8) }),
      'Noventa. Qué número elegante. Hay gente que se cree que los años pesan: los años lo que hacen es enseñar a sentarse mejor.',
    ]),
    eleccion('noventa-resp', '¿Qué le decís a Herminia?', [
      opcion('feliz', 'Feliz cumpleaños, Herminia.', { sabor: true }),
      opcion('secreto', '¿Cuál es el secreto para llegar a los noventa?', { sabor: true }),
    ]),
    dlg('herminia', [linea('Gracias, m\'hijo. Se me hace que este año me cantan el cumpleaños los pájaros del fondo.', { gesto: gs('hacer-broma', 2) })], { si: siEleg('noventa-resp', 'feliz') }),
    dlg('herminia', ['No contestar las preguntas de los doctores. Y dejar siempre un pan en la mesa para el que llegue.'], { si: siEleg('noventa-resp', 'secreto') }),
    plano('primer', 'herminia', { desde: 'jugador', mezcla: 0.8, dur: 30, sinEsperar: true }),
    dlg('herminia', [
      'Esperá. Tengo algo para vos. Lo guardé setenta y siete años por si alguien lo merecía.',
      linea('Yo era una nena. Estaba jugando entre las raíces del coihue grande, y debajo de una, en la tierra, encontré esto. Chiquito como una uña.', { gesto: gs('contar', 2.6) }),
    ]),
    plano('detalle', FRENTE(1), { desde: 'jugador', dist: 0.8, alto: 1.2, dur: 3, mezcla: 0.8 }),
    narra('Una llave de bronce, chiquita, con el ojo en forma de hoja. Pesa casi nada. Está tibia, aunque la sacó de un cajón.'),
    dlg('herminia', ['La llavecita. No sé a qué puerta abre. Pero tengo una idea de dónde queda la puerta.']),
    efecto('objeto:llavecita'),
    efecto('lazo:herminia:2'),
    efecto('raro:llavecita'),
  ],
};

export const ESCENAS_C8 = {
  'cuaderno-1': cuaderno1,
  'cuaderno-2': cuaderno2,
  'cuaderno-3': cuaderno3,
  'libreta-fiado': libretaFiado,
  'cuaderno-abuelo': cuadernoAbuelo,
  'los-del-cerro': losDelCerro,
  'secreto-ramon': secretoRamon,
  'fogon-leyenda': fogonLeyenda,
  'pluma-umbral': plumaUmbral,
  'veta-vuelve': vetaVuelve,
  'mulas-belisario': mulasBelisario,
  'herminia-noventa': herminiaNoventa,
};
export const EFECTOS_C8 = [...new Set(Object.values(ESCENAS_C8).flatMap((e) => efectosDe(e)))].sort();
