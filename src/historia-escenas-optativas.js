// 4.18.0 (B): las escenas de las SUBTRAMAS OPTATIVAS de la Historia («El trato del molino», GUION_HISTORIA.md, bloques «Optativas» de cada
// capítulo y §6) que no tenían escena: el frasco de la repisa (tomarlo y llevárselo a Rosa), la oveja de Ramón, el pan para Fermín, los dos
// primeros lugares de «Una vuelta para la ingeniera» (el mirador del pehuén y el faro; la casa de té ya era `te-graciela`) y juntar las ovejas
// del D5 (la tranquera abierta de `hojas-canelo`). Datos puros, con el formato del motor (escenas.js) y la misma forma que los actos:
//   · ESCENAS_OPTATIVAS      id → escena;
//   · IDS_OPTATIVAS          los ids, en orden de capítulo;
//   · EFECTOS_OPTATIVAS      todos los nombres de efecto que usan (para registrarlos uno por uno, como EFECTOS_ACTO3);
//   · DISPARO_OPTATIVAS      por escena: capítulo, dónde está parado el jugador, cuándo y qué optativa la cuenta como hecha;
//   · POR_DEFECTO_OPTATIVAS  ninguna decide nada grande: vacío (está para que el que junta trate a todos los módulos igual).
// Los textos (tablón, objetos, cuaderno de lo raro, la charla de después) están en historia-texto-optativas.js. Lo nuevo: CAMBIOS_4_18_0_B.md.
import { efectosDe, dlg, narra, linea, gs, plano, pose, aparece, camina, mira, sonido, efecto, opcion, eleccion, siEleg, siDecision } from './historia-escenas-util.js';
import { FRENTE, con } from './historia-escenas-acto2-util.js';
import { pj3 } from './historia-escenas-acto3-util.js';

// la variante del perro de la oveja de Ramón: el evento del valle `oveja` se resolvió mandando al perro (condición `evento` con `opcion`)
const conPerro = { cond: 'evento', args: { id: 'oveja', opcion: 'perro' } };
const sinPerro = { ...conPerro, no: true };

// ---------------------------------------------------------------- capítulo 1 · El frasco de la repisa (tomarlo)
const frascoRepisa = {
  id: 'frasco-repisa', titulo: 'El frasco de la repisa', acto: 1, capitulo: 1,
  resumen: 'Bajaste el frasco de masa madre de la repisa de Eusebio. Abajo había otro papelito: que se lo lleven a la panadera, y que lo alimente los martes.',
  personajes: pj3('nota', 'narra'),
  pasos: [
    plano('general', 'jugador', { dist: 4.6, alto: 2.4, dur: 2.2 }),
    plano('detalle', FRENTE(0.9), { dist: 0.7, alto: 1.5, dur: 3, mezcla: 0.8 }),
    narra('Un frasco de vidrio grueso, con una tela atada con piolín por tapa. Adentro, una masa gris que respira: cada tanto sube una burbuja y revienta sin apuro.'),
    narra('Tiene una etiqueta con la letra inclinada de Eusebio: «1987». Abajo del frasco, doblado en cuatro, hay otro papelito.'),
    sonido('anotar'),
    dlg('nota', [
      'Ya sé que dije que no lo toques. Si lo estás tocando, es porque hace falta.',
      'Llevásela a la panadera, que la masa sola se aburre. Harina y agua tibia los martes. Y gracias. E. M.',
    ]),
    eleccion('frasco-hablar', '¿Qué hacés antes de salir?', [
      opcion('bajito', 'Hablarle bajito, como a la estufa.', { sabor: true }),
      opcion('tela', 'Ajustarle la tela, que no se enfríe.', { sabor: true }),
    ]),
    con(narra('No pasa nada. O sí: sube una burbuja más grande que las otras. Lo tomás como un sí.'), siEleg('frasco-hablar', 'bajito')),
    con(narra('Le das dos vueltas al piolín. El frasco está tibio, como un animal chico dormido.'), siEleg('frasco-hablar', 'tela')),
    efecto('objeto:frasco-masa-madre'),
    efecto('raro:frasco-de-1987'),
  ],
};

// ---------------------------------------------------------------- capítulo 2 · El frasco de la repisa (llevárselo a Rosa)
const frascoRosa = {
  id: 'frasco-rosa', titulo: 'Masa de 1987', acto: 1, capitulo: 2,
  resumen: 'Le llevaste a Rosa el frasco de masa madre de Eusebio. Lo abrió como quien abre una carta y prometió dejarte el primer pan de cada mañana, tres días.',
  personajes: pj3('rosa', 'narra'),
  pasos: [
    plano('medio', 'rosa', { desde: 'jugador', dist: 3.2, dur: 3, mezcla: 0.9 }),
    mira('rosa', 'jugador'),
    efecto('entrega:frasco-masa-madre'),
    dlg('rosa', [
      linea('¿Eso es lo que creo? ¡Dame, dame!', { gesto: gs('sorprenderse', 1.6) }),
      linea('Masa de Eusebio. Del ochenta y siete. Y está viva, la muy terca.', { gesto: gs('amasar', 2.2), plano: { plano: 'primer', a: 'rosa', desde: 'jugador', mezcla: 0.7, dur: 30, sinEsperar: true } }),
    ]),
    plano('detalle', FRENTE(1.1), { desde: 'jugador', dist: 0.8, alto: 1.2, dur: 2.6, mezcla: 0.8 }),
    narra('Rosa desata el piolín, levanta la tela y mete la nariz. Cierra los ojos. Así se huele una carta de alguien que ya no está.'),
    dlg('rosa', [linea('Primero la harina, ahora la masa. Me vas a terminar trayendo al molinero entero, en cuotas.', { gesto: gs('hacer-broma', 1.8) })], { si: siDecision('bolsa', 'b') }),
    con(dlg('rosa', ['Me la prometió el invierno que se enfermó. Pensé que se la había llevado con él, adonde sea que van los molineros.']), { ...siDecision('bolsa', 'b'), no: true }),
    plano('hombro', 'rosa', { desde: 'jugador', lado: -1, mezcla: 0.7, dur: 30, sinEsperar: true }),
    eleccion('rosa-frasco', '¿Qué le decís a Rosa?', [
      opcion('tuya', 'Ahora es suya, Rosa. Cuídela.', { sabor: true }),
      opcion('eusebio', '¿Cómo era Eusebio con usted?', { sabor: true }),
      opcion('martes', 'La nota dice que come los martes.', { sabor: true }),
    ]),
    dlg('rosa', [linea('Mía no. Es de la aldea. Yo nomás le doy de comer, como decía él del molino.', { gesto: gs('asentir', 1.8) })], { si: siEleg('rosa-frasco', 'tuya') }),
    dlg('rosa', ['Me traía harina y se quedaba a ver cómo leudaba, sin decir nada. Una vez le pregunté qué miraba. «Cómo trabaja lo que no se ve», me dijo.'], { si: siEleg('rosa-frasco', 'eusebio') }),
    dlg('rosa', [linea('¿Le escribía notas a un frasco? Este hombre. Bueno, los martes. Y le hablo bajito, por las dudas.', { gesto: gs('reir', 1.8) })], { si: siEleg('rosa-frasco', 'martes') }),
    dlg('rosa', [
      'Pasate mañana temprano, que el primer pan es tuyo. Y pasado. Y el otro.',
      linea('Tres días. Después se te acostumbra la panza y te cobro.', { gesto: gs('senalar', 1.6) }),
    ]),
    efecto('mundo:pan-de-rosa', { cosa: 'pan-casero', n: 1, dias: 3 }),
    efecto('lazo:rosa:1'),
  ],
};

// ---------------------------------------------------------------- capítulo 2 · La oveja de Ramón
const ovejaRamon = {
  id: 'oveja-ramon', titulo: 'La Porfiada', acto: 1, capitulo: 2,
  resumen: 'La oveja escapada volvió al corral del Puesto Alto. Ramón te contó que se llama la Porfiada, que se escapa todos los veranos para el lado de las piedras y que Eusebio siempre se la traía.',
  personajes: pj3('ramon', 'narra'),
  pasos: [
    efecto('mundo:majada-pasa', { cerca: FRENTE(8, -3) }),
    plano('general', FRENTE(8, -3), { desde: 'jugador', dist: 14, alto: 3.6, dur: 3.2, mezcla: 0.9 }),
    con(narra('La oveja entra al corral sin apuro, con la cabeza alta, como quien vuelve de un mandado. Atrás venís vos, con dos horas de cerro en las botas.'), sinPerro),
    con(narra('La oveja llegó sola, a la nochecita, con tu perro atrás dándole charla. Entró al corral primero. El perro, contentísimo, se quedó afuera.'), conPerro),
    aparece('ramon', FRENTE(3.2, 1.2)),
    plano('medio', 'ramon', { desde: 'jugador', dist: 3.2, mezcla: 0.9, dur: 1, sinEsperar: true }),
    con(dlg('ramon', [linea("La trajiste vos. Se te nota en las botas, m'hijo. Esa no camina: elige por dónde.", { gesto: gs('tomar-mate', 2) })]), sinPerro),
    con(dlg('ramon', [linea('Tu perro arrea como yo bailo: con muchas ganas y ningún resultado. Pero la trajo. O ella lo trajo a él.', { gesto: gs('reir', 2) })]), conPerro),
    dlg('ramon', [
      'Se llama la Porfiada. No se lo puse yo: se lo ganó.',
      linea('Todos los veranos se escapa para el lado de las piedras. Eusebio me la traía siempre. Decía que iba a visitar a alguien.', { gesto: gs('barba', 2.4), plano: { plano: 'primer', a: 'ramon', desde: 'jugador', mezcla: 0.7, dur: 30, sinEsperar: true } }),
    ]),
    eleccion('porfiada-resp', '¿Qué le decís a Don Ramón?', [
      opcion('atar', '¿Y por qué no la ata, Don Ramón?', { sabor: true }),
      opcion('visitar', '¿A visitar a quién?', { sabor: true }),
      opcion('nada', 'No me debe nada, Don Ramón.', { sabor: true }),
    ]),
    dlg('ramon', [linea('Si la ato se me muere de tristeza. Hay animales que necesitan irse un poco para volver.', { gesto: gs('negar', 1.8) })], { si: siEleg('porfiada-resp', 'atar') }),
    dlg('ramon', [
      linea('A los zorros, le decía yo. Él se reía.', { gesto: gs('encogerse', 1.6) }),
      'Vos dejala ir, si querés. Pero después traémela.',
    ], { si: siEleg('porfiada-resp', 'visitar') }),
    dlg('ramon', [linea('Ya sé que no. Por eso te lo debo. Acá las cosas se deben al revés.', { gesto: gs('asentir', 1.8) })], { si: siEleg('porfiada-resp', 'nada') }),
    plano('general', FRENTE(6, 2), { desde: 'jugador', dist: 10, alto: 2.6, dur: 2.6, mezcla: 0.9 }),
    narra('La Porfiada ya está mirando otra vez para el lado de las piedras. Ramón la mira a ella, y vos lo mirás a él: tienen la misma cara.'),
    pose('ramon', 'saludar', { dur: 1.2 }),
    camina('ramon', FRENTE(12, -6), { vel: 1.1 }),
    efecto('lazo:ramon:1'),
    efecto('raro:la-porfiada'),
  ],
};

// ---------------------------------------------------------------- capítulo 3 · Pedido de Fermín (pan para el galpón de esquila)
const panFermin = {
  id: 'pan-fermin', titulo: 'Pan en la estepa', acto: 1, capitulo: 3,
  resumen: 'Le llevaste pan o harina a Fermín al galpón de esquila. Lo compartió «a medias, como las ovejas», y espantó un chimango con un cascote sin mirar.',
  personajes: pj3('fermin', 'narra'),
  pasos: [
    plano('general', 'fermin', { desde: 'jugador', dist: 14, alto: 3.4, miraY: 1.5, dur: 3.2 }),
    narra('En la estepa el viento no para nunca: se acuesta un rato y vuelve. Fermín está sentado en el cerco del corral, con el sombrero atado con un tiento.'),
    mira('fermin', 'jugador'),
    plano('medio', 'fermin', { desde: 'jugador', dist: 3.2, mezcla: 1, dur: 1, sinEsperar: true }),
    dlg('fermin', [linea('Me trajiste. No te lo pedí, eh. Te dije que no te iba a decir que no, que es distinto.', { gesto: gs('encogerse', 1.8) })]),
    eleccion('fermin-pan-que', '¿Qué le das?', [
      opcion('pan', 'El pan, que todavía está tibio.', { efecto: 'quitar:pan-casero:1' }),
      opcion('harina', 'La harina, para que la amase.', { efecto: 'quitar:harina:1' }),
    ]),
    dlg('fermin', [linea('Lo parto. A medias, como las ovejas: la mitad para vos, que la trajiste.', { gesto: gs('contar', 2) })], { si: siEleg('fermin-pan-que', 'pan') }),
    dlg('fermin', [linea('Harina. Bueno, acá el horno es el sol, pero algo se inventa: una tortita en la lata, con grasa.', { gesto: gs('pensar', 2) })], { si: siEleg('fermin-pan-que', 'harina') }),
    plano('general', FRENTE(7, 3), { desde: 'jugador', dist: 9, alto: 2.8, dur: 2.6, mezcla: 0.9 }),
    narra('Un chimango baja a mirar las migas. Fermín, sin darse vuelta, levanta un cascote del suelo y lo revolea. El chimango sale ofendido. Lo hizo como quien se rasca.'),
    plano('primer', 'fermin', { desde: 'jugador', mezcla: 0.7, dur: 30, sinEsperar: true }),
    dlg('fermin', [linea('De chico espantaba zorros. Se me quedó la mano. No lo andes contando.', { gesto: gs('mirar', 1.8) })]),
    eleccion('fermin-pan-resp', '¿Qué le contestás?', [
      opcion('punteria', 'Qué puntería, Fermín.', { sabor: true }),
      opcion('callar', 'No cuento nada.', { sabor: true }),
    ]),
    dlg('fermin', ['Puntería no. Costumbre. La puntería es para los que apuntan.'], { si: siEleg('fermin-pan-resp', 'punteria') }),
    dlg('fermin', [linea('Ya sé. Por eso te lo mostré.', { gesto: gs('asentir', 1.6) })], { si: siEleg('fermin-pan-resp', 'callar') }),
    efecto('lazo:fermin:1'),
    efecto('raro:pan-en-la-estepa'),
  ],
};

// ---------------------------------------------------------------- capítulo 4 · Una vuelta para la ingeniera: el mirador del pehuén
const vueltaMirador = {
  id: 'vuelta-mirador', titulo: 'La vía, desde arriba', acto: 1, capitulo: 4,
  resumen: 'Llevaste a Graciela al mirador del pehuén. Desde arriba la vía parecía un piolín; ella midió el valle con el lápiz, como su abuelo con la pala del carbón, y no anotó nada.',
  personajes: pj3('graciela', 'narra'),
  pasos: [
    plano('general', { lugar: 'mirador' }, { dist: 18, alto: 5.2, miraY: 1, dur: 3.6, mezcla: 0.9 }),
    narra('Desde el mirador se ve todo: el lago quieto, el humo de la aldea, el arroyo bajando, y la vía de la trochita, finita, cosida al costado del cerro.'),
    aparece('graciela', FRENTE(2.4, 1)),
    plano('medio', 'graciela', { desde: 'jugador', dist: 3, mezcla: 0.9, dur: 1, sinEsperar: true }),
    dlg('graciela', [
      linea('Desde acá la vía parece un piolín.', { gesto: gs('senalar', 1.8) }),
      'Doce toneladas por mes. Y desde acá no se ve ninguna tonelada. Qué problema.',
    ]),
    plano('hombro', 'graciela', { desde: 'jugador', lado: 1, mezcla: 0.7, dur: 30, sinEsperar: true }),
    narra('Saca el lápiz, estira el brazo y mide el valle de punta a punta, con un ojo cerrado, como hacen los pintores. Después se ríe sola.'),
    dlg('graciela', [linea('Mi abuelo hacía esto con la pala del carbón, desde la cabina. Decía que medía cuánto faltaba para la próxima parada.', { gesto: gs('pensar', 2.2) })]),
    eleccion('mirador-graciela', '¿Qué le mostrás?', [
      opcion('aldea', 'La aldea: ahí viven los que cargan.', { sabor: true }),
      opcion('pehuen', 'El pehuén: tiene más años que el ramal.', { sabor: true }),
      opcion('via', 'La vía: mire cómo sube el cerro.', { sabor: true }),
    ]),
    dlg('graciela', ['La gente no figura en la planilla. Ya sé. Lo dije yo. Me lo van a repetir hasta el invierno, ¿no?'], { si: siEleg('mirador-graciela', 'aldea') }),
    dlg('graciela', [linea('Más años que el ramal y no da toneladas. Y sin embargo nadie lo cerraría. Interesante.', { gesto: gs('mirar', 1.8) })], { si: siEleg('mirador-graciela', 'pehuen') }),
    dlg('graciela', ['Sube bien. La hicieron con pico y pala, curva por curva. Eso tampoco figura en la planilla.'], { si: siEleg('mirador-graciela', 'via') }),
    plano('primer', 'graciela', { desde: 'jugador', mezcla: 0.7, dur: 30, sinEsperar: true }),
    narra('Abre la libreta. La mira. La cierra sin escribir.'),
    dlg('graciela', [linea('No lo anoto. Lo voy a recordar, que es peor.', { gesto: gs('suspirar', 2) })]),
    efecto('raro:graciela-en-el-mirador'),
  ],
};

// ---------------------------------------------------------------- capítulo 4 · Una vuelta para la ingeniera: el faro
const vueltaFaro = {
  id: 'vuelta-faro', titulo: 'Botas de oficina', acto: 1, capitulo: 4,
  resumen: 'Llevaste a Graciela al faro. Se le mojaron las botas en la orilla, se rió por primera vez, y te contó que en Trevelin también contaban cosas del agua hasta que cerraron el ramal.',
  personajes: pj3('graciela', 'narra'),
  pasos: [
    plano('general', { lugar: 'faro' }, { dist: 20, alto: 4.4, miraY: 3, dur: 3.6, mezcla: 0.9 }),
    narra('El faro es blanco y chato, con la pintura comida por el viento. El agua llega a la orilla en olitas chicas, como quien golpea antes de entrar.'),
    aparece('graciela', FRENTE(2.6, -1)),
    plano('medio', 'graciela', { desde: 'jugador', dist: 3.2, mezcla: 0.9, dur: 1, sinEsperar: true }),
    narra('Graciela da un paso de más. Una ola le entra en la bota izquierda. Se queda mirándose el pie, muy seria, y después se ríe.'),
    dlg('graciela', [
      linea('Estas botas eran para oficinas. Desde hoy son para el lago.', { gesto: gs('reir', 2) }),
      '¿Lo prenden todavía? El faro, digo.',
    ]),
    plano('hombro', 'graciela', { desde: 'jugador', lado: -1, mezcla: 0.7, dur: 30, sinEsperar: true }),
    eleccion('faro-graciela', '¿Qué le contestás?', [
      opcion('luces', 'Nicanor dice que de noche hay luces sobre el lago.', { sabor: true }),
      opcion('botas', 'Le presto unas botas de goma para la próxima.', { sabor: true }),
      opcion('atardecer', 'Quédese a ver el atardecer. Después decide.', { sabor: true }),
    ]),
    dlg('graciela', [
      linea('Luces. En Trevelin también contaban cosas del agua.', { gesto: gs('pensar', 2) }),
      'Después cerraron el ramal y no las contó nadie más. Las cosas que no se cuentan se mueren, ¿sabe?',
    ], { si: siEleg('faro-graciela', 'luces') }),
    dlg('graciela', [linea('«La próxima.» Usted da por hecho que vuelvo. Mire que soy de la Administración, eh.', { gesto: gs('hacer-broma', 1.8) })], { si: siEleg('faro-graciela', 'botas') }),
    dlg('graciela', ['El tren de vuelta sale a las seis. Tengo media hora. Media hora de atardecer, y después decido. Trato hecho.'], { si: siEleg('faro-graciela', 'atardecer') }),
    plano('general', FRENTE(12, 0), { desde: 'jugador', dist: 6, alto: 1.8, miraY: 1, dur: 3, mezcla: 0.9 }),
    narra('Se sienta en una piedra, se saca la bota y la pone boca abajo. Mira el lago un rato largo, con la media mojada al sol, y no saca la libreta.'),
    efecto('raro:graciela-en-el-faro'),
  ],
};

// ---------------------------------------------------------------- capítulo 9 · Juntar las ovejas (la tranquera abierta del D5)
const juntarOvejas = {
  id: 'juntar-ovejas', titulo: 'Las ovejas, juntas', acto: 3, capitulo: 9,
  resumen: 'Juntaste las ovejas desparramadas y cerraste la tranquera del corral. En el poste había un piolín colorado atado con un nudo chiquito, igual al de la bolsa de Eusebio.',
  personajes: pj3('fermin', 'belisario', 'narra'),
  pasos: [
    efecto('mundo:ovejas-juntas', { donde: FRENTE(6, 2) }),
    plano('general', FRENTE(10, 3), { desde: 'jugador', dist: 20, alto: 5, miraY: 1, dur: 3.6, mezcla: 0.9 }),
    narra('La última oveja entra al corral a los empujones, ofendida, como si la hubieras sacado de una fiesta. Las otras ya rumian como si no hubiera pasado nada.'),
    sonido('bisagra'),
    plano('detalle', FRENTE(1.3, 0.4), { desde: 'jugador', dist: 0.8, alto: 1.2, dur: 3, mezcla: 0.8 }),
    narra('Al cerrar la tranquera lo ves: atado al poste, un piolín colorado, con un nudo chiquito y prolijo. Igual al de la bolsa de Eusebio.'),
    con(aparece('fermin', FRENTE(8, -3)), siDecision('majada', 'a')),
    con(plano('medio', 'fermin', { desde: 'jugador', dist: 3.6, mezcla: 0.9, dur: 30, sinEsperar: true }), siDecision('majada', 'a')),
    con(dlg('fermin', [
      linea('Las conté. Están todas. Hasta la Porfiada, que fue la primera en irse, seguro.', { gesto: gs('contar', 2) }),
      'Eso no lo ató Ramón. Ramón ata con alambre.',
    ]), siDecision('majada', 'a')),
    con(narra('Estás solo con la majada que prometiste cuidar. El balde de agua tiene una tela de hielo y el piolín se mueve con el viento, como saludando.'), siDecision('majada', 'b')),
    con(aparece('belisario', FRENTE(9, 3)), siDecision('majada', 'c')),
    con(plano('medio', 'belisario', { desde: 'jugador', dist: 3.6, mezcla: 0.9, dur: 30, sinEsperar: true }), siDecision('majada', 'c')),
    con(dlg('belisario', [linea('Me dijeron que se le desparramaron. Las ovejas saben cuándo las venden, amigo. Y alguien más también, parece.', { gesto: gs('barba', 2) })]), siDecision('majada', 'c')),
    plano('hombro', FRENTE(1.3, 0.4), { desde: 'jugador', lado: 1, mezcla: 0.7, dur: 30, sinEsperar: true }),
    eleccion('ovejas-poste', '¿Qué hacés con el piolín?', [
      opcion('dejar', 'Dejarlo atado. No es tuyo.', { sabor: true }),
      opcion('yerba', 'Dejar un puñado de yerba al pie del poste.', { efecto: 'quitar:yerba:1' }),
      opcion('guardar', 'Desatarlo y guardarlo en el bolsillo.', { sabor: true }),
    ]),
    con(narra('Lo dejás donde está. Un recado se contesta; no se arranca.'), siEleg('ovejas-poste', 'dejar')),
    con(narra('Dejás la yerba al pie del poste, como deja Ramón en la raíz de la ladera, aunque él nunca lo haya contado. El viento no se la lleva.'), siEleg('ovejas-poste', 'yerba')),
    con(narra('El nudo se deshace solo, apenas lo tocás, como si estuviera esperando. El piolín queda tibio en el bolsillo.'), siEleg('ovejas-poste', 'guardar')),
    efecto('lazo:ramon:1'),
    efecto('raro:ovejas-juntas'),
  ],
};

// ---------------------------------------------------------------- todas
export const ESCENAS_OPTATIVAS = {
  'frasco-repisa': frascoRepisa,
  'frasco-rosa': frascoRosa,
  'oveja-ramon': ovejaRamon,
  'pan-fermin': panFermin,
  'vuelta-mirador': vueltaMirador,
  'vuelta-faro': vueltaFaro,
  'juntar-ovejas': juntarOvejas,
};
export const IDS_OPTATIVAS = Object.keys(ESCENAS_OPTATIVAS);

// Todos los efectos que usan juntas (para registrar uno por uno en el aplicador de la historia)
export const EFECTOS_OPTATIVAS = [...new Set(Object.values(ESCENAS_OPTATIVAS).flatMap((e) => efectosDe(e)))].sort();

// Ninguna decide nada grande: no hay opción por defecto que valga si se saltean
export const POR_DEFECTO_OPTATIVAS = {};

// Dónde y cuándo se dispara cada una. `objetivo`: el id de la optativa (TEXTO_ACTO1/TEXTO_ACTO3 .capitulos[n].optativas[].id) que la escena
// cuenta como hecha; null si sólo prepara (tomar el frasco). `ofrece`: la escena que ofrece la optativa (corre `optativa:<id>`);
// null si la ofrece el capítulo (el registro de A) o un evento del valle.
const d = (cap, jugadorEn, cuando, objetivo, ofrece) => ({ cap, jugadorEn, cuando, objetivo, ofrece });
export const DISPARO_OPTATIVAS = {
  'frasco-repisa': d(1, 'adentro del refugio, frente a la repisa', 'E en el frasco de la repisa (capítulos 1 y 2, después de nota-eusebio): el frasco va a la mochila', null, null),
  'frasco-rosa': d(2, 'frente a Rosa, en la panadería', 'hablar con Rosa (panadera) con el frasco en la mochila, capítulos 1 y 2 (el guion la abre en el 2; si se pasa, hasta el fin del acto I)', 'frasco-masa-madre', 'nota-eusebio'),
  'oveja-ramon': d(2, 'en el Puesto Alto, junto al corral de Ramón', 'después del evento del valle «oveja» (forzado en el capítulo 2 como momento opcional), al llegar al Puesto Alto; mira si se mandó al perro', 'oveja', null),
  'pan-fermin': d(3, 'frente a Fermín, en el galpón de esquila', 'hablar con Fermín con pan casero o harina en la mochila, después de fermin-galpon (capítulo 3; hasta el fin del acto I)', 'fermin-pan', 'fermin-galpon'),
  'vuelta-mirador': d(4, 'en el mirador del pehuén, con Graciela al lado (acompañante)', 'llegar al mirador con Graciela de acompañante, después de anden-graciela', 'vuelta-ingeniera', null),
  'vuelta-faro': d(4, 'en la orilla, junto al faro, con Graciela al lado (acompañante)', 'llegar al faro con Graciela de acompañante, después de anden-graciela', 'vuelta-ingeniera', null),
  'juntar-ovejas': d(9, 'en la tranquera del corral del Puesto Alto, con la última oveja entrando', 'al terminar de juntar las ovejas desparramadas (la mecánica de A), sólo si hojas-canelo ofreció la optativa (no convidaste)', 'juntar-ovejas', 'hojas-canelo'),
};
