// 4.17.0 (B): ACTO III · capítulo 9 «Los primeros fríos» (GUION_HISTORIA.md). Ocho escenas como datos, con el formato del motor (escenas.js) y las
// convenciones de efectos de los actos I y II (lo nuevo está en CAMBIOS_4_17_0_B.md). La decisión D5 (la majada de Ramón) se toma en
// `fermin-tranquera` y se cumple en una de tres escenas: `majada-fermin` (A), `majada-vos` (B) o `majada-belisario` (C). Gana la última acción.
import { efectosDe, dlg, narra, linea, gs, plano, pose, aparece, camina, mira, desaparece, sonido, efecto, opcion, eleccion, siEleg, siDecision } from './historia-escenas-util.js';
import { FRENTE, apagon, hora, con, no } from './historia-escenas-acto2-util.js';
import { pj3, siConvidado, siRamal, primerDe } from './historia-escenas-acto3-util.js';

const ramonEnCama = {
  id: 'ramon-cama', titulo: 'Ramón en cama', acto: 3, capitulo: 9,
  resumen: 'En el Puesto Alto, Ramón estaba tapado con una manta junto a la estufa. Marta lo mandó a reposo en la aldea; él preguntó quién sube con la majada, y te dijo que hace un mes te firmó un papel «por las dudas».',
  personajes: pj3('ramon', 'marta', 'narra'),
  disparador: { hora: [8, 12] },
  pasos: [
    plano('general', FRENTE(3), { desde: 'jugador', dist: 8, alto: 2.4, dur: 3.4, mezcla: 0.9 }),
    narra('El cuarto del Puesto Alto es chico y oscuro. Hay olor a humo, a lana mojada y a yuyo. La estufa tira poco y las ventanas tienen una tela de escarcha por dentro.'),
    aparece('ramon', FRENTE(3, 0.8)),
    aparece('marta', FRENTE(3.2, -1.3)),
    pose('ramon', 'cruzarse', { dur: 1.6 }),
    plano('medio', 'ramon', { desde: 'jugador', dist: 3, mezcla: 0.9, dur: 3 }),
    narra('Ramón está sentado con una manta hasta el pecho. Tiene la boina puesta y el mate en la mano, como si estuviera de visita en su propia casa.'),
    plano('medio', 'marta', { desde: 'jugador', dist: 3, mezcla: 0.8, dur: 30, sinEsperar: true }),
    dlg('marta', [
      linea('Fiebre y la cadera. Dos semanas de reposo en la aldea, cerca del puesto sanitario.', { gesto: gs('tocar', 2) }),
      'No es negociable, don Ramón.',
    ]),
    plano('primer', 'ramon', { desde: 'jugador', mezcla: 0.8, dur: 30, sinEsperar: true }),
    dlg('ramon', [
      linea('Todo es negociable. Menos la majada.', { gesto: gs('cruzarse', 2) }),
      '¿Quién sube con la majada?',
    ]),
    plano('primer', 'marta', { desde: 'jugador', mezcla: 0.7, dur: 30, sinEsperar: true }),
    mira('marta', 'jugador'),
    dlg('marta', [linea('Esa es otra pregunta.', { gesto: gs('senalar', 1.8) })]),
    plano('hombro', 'ramon', { desde: 'jugador', lado: -1, mezcla: 0.7, dur: 30, sinEsperar: true }),
    dlg('ramon', [
      "Hace un mes te firmé un papel, por las dudas, m'hijo. Ercilia te lo guarda. Con eso podés hacer lo que haga falta.",
      linea('Pero vos sabés lo que hace falta.', { gesto: gs('barba', 2.4) }),
    ]),
    eleccion('cama-resp', '¿Qué le contestás a Don Ramón?', [
      opcion('fiebre', 'Primero la fiebre, Don Ramón. Lo demás se arregla.', { efecto: 'lazo:ramon:1' }),
      opcion('papel', '¿Qué dice exactamente el papel?', { sabor: true }),
      opcion('marta', 'Marta tiene razón: a la aldea.', { sabor: true }),
    ]),
    dlg('ramon', [linea("Fiebre, fiebre. Cuarenta años de fiebre y nunca me tumbó. Bueno… ya veremos, m'hijo. Gracias por no discutir.", { gesto: gs('asentir', 2) })], { si: siEleg('cama-resp', 'fiebre') }),
    dlg('ramon', ['Dice que podés disponer de la majada «como mejor convenga». Lo escribió Ercilia. Yo puse la firma y un manchón de mate.'], { si: siEleg('cama-resp', 'papel') }),
    dlg('marta', [linea('Gracias. Alguien en este valle tiene que escuchar a una enfermera.', { gesto: gs('hacer-broma', 2) })], { si: siEleg('cama-resp', 'marta') }),
    efecto('mundo:ramon-convaleciente', { donde: FRENTE(3, 0.8) }),
    efecto('raro:ramon-en-cama'),
  ],
};

const ferminTranquera = {
  id: 'fermin-tranquera', titulo: '¿Quién sube con la majada?', acto: 3, capitulo: 9,
  resumen: 'Fermín llegó a caballo hasta la tranquera del Puesto Alto y se ofreció a llevarse la majada entera. Tenías que decidir quién sube con ella: Fermín, vos, o venderla a Belisario con el papel de Ramón.',
  personajes: pj3('fermin', 'ramon', 'marta', 'narra'),
  pasos: [
    plano('general', FRENTE(10, -4), { desde: 'jugador', dist: 20, alto: 4.6, miraY: 3, dur: 3.6, mezcla: 0.9 }),
    narra('Afuera el aire pica. Arriba, en el cerro, la nieve llegó hasta donde empiezan las lengas. En la tranquera hay un jinete chiquito contra el cielo blanco.'),
    aparece('fermin', FRENTE(11, -3)),
    aparece('ramon', FRENTE(4, 2)),
    plano('medio', 'fermin', { desde: 'jugador', dist: 4, mezcla: 0.9, dur: 3 }),
    mira('fermin', 'jugador'),
    dlg('fermin', [
      linea('Si quiere, me la llevo yo. Entera.', { gesto: gs('mirar', 2) }),
      'Ya sé que no es lo mismo. Pero las ovejas me conocen, y yo a ellas.',
    ]),
    plano('empuje', 'ramon', { desde: 'jugador', dist: 4.4, distFin: 2.4, alto: 1.6, dur: 4, mezcla: 0.9 }),
    narra('Ramón apoyado en el marco de la puerta, con la manta de capa y un bastón que nunca usó. Mira la majada, mira a Fermín, te mira a vos. Tarda en contestar.'),
    plano('general', FRENTE(5, 1), { desde: 'jugador', dist: 12, alto: 3, dur: 2.6, mezcla: 0.8 }),
    narra('Es tu papel. Tres caminos y ninguno es solo de la majada: también son de Ramón, de Fermín y de lo que le pasó a cada uno.'),
    eleccion('majada', '¿Quién sube con la majada?', [
      opcion('a', 'Que la lleve Fermín, entera.', { efecto: 'decision:majada:a' }),
      opcion('b', 'La cuido yo hasta que Ramón se cure.', { efecto: 'decision:majada:b' }),
      opcion('c', 'Venderle la majada a Belisario.', { efecto: 'decision:majada:c' }),
    ]),
    con(pose('ramon', 'juntas', { dur: 2.2 }), siEleg('majada', 'a')),
    con(dlg('ramon', [linea('Llevala. Y no me la devuelvas flaca.', { gesto: gs('suspirar', 2.4) })]), siEleg('majada', 'a')),
    con(narra('Fermín se saca el sombrero. Es la primera vez que lo ves quedarse sin saber qué hacer con las manos.'), siEleg('majada', 'a')),
    con(pose('ramon', 'asentir', { dur: 1.8 }), siEleg('majada', 'b')),
    con(dlg('ramon', ['Vos.']), siEleg('majada', 'b')),
    con(narra('Fermín no dice nada. Da media vuelta con el caballo y se va despacio, derecho, sin mirar atrás. Es la manera más educada de estar herido que viste.'), siEleg('majada', 'b')),
    con(camina('fermin', FRENTE(30, -10), { vel: 1.6 }), siEleg('majada', 'b')),
    con(narra('Sacás el papel que guarda Ercilia en la memoria: una hoja con el pulso de Ramón y un manchón de mate. Ramón no te mira. Mira la ladera donde la majada se mueve como una nube sucia.'), siEleg('majada', 'c')),
    con(dlg('ramon', ["Andá. Hacé lo que tengas que hacer, m'hijo."]), siEleg('majada', 'c')),
    con(narra('Fermín mira el suelo. Ramón mira el aire. Los dos saben qué se está comprando acá y cuánto cuesta, y ninguno dice nada.'), siEleg('majada', 'c')),
    efecto('raro:majada-decision'),
  ],
};

const majadaFermin = {
  id: 'majada-fermin', titulo: 'La majada, entera', acto: 3, capitulo: 9,
  resumen: 'Ayudaste a Fermín a arrear la majada de Ramón hasta el galpón de esquila, a caballo, por delante. Fermín no se va con Belisario y te vende lana a precio de amigo; Ramón, en cambio, tiene que aprender a soltar.',
  personajes: pj3('fermin', 'belisario', 'narra'),
  pasos: [
    efecto('decision:majada:a'),
    efecto('mundo:majada-al-galpon', { donde: FRENTE(12, 4) }),
    plano('travelling', 'fermin', { desde: 'jugador', dist: 6, alto: 2.2, lado: 1, dur: 3.6, sinEsperar: true }),
    aparece('fermin', FRENTE(7, -2)),
    camina('fermin', FRENTE(22, -4), { vel: 2 }),
    plano('general', FRENTE(14, 2), { desde: 'jugador', dist: 24, alto: 5, miraY: 2, dur: 3.8, mezcla: 0.9 }),
    narra('Doscientas ovejas siguen al caballo como una marea gris por la estepa blanca. Vos vas adelante con el zaino y la guía, y Fermín atrás con el silbido.'),
    plano('medio', 'fermin', { desde: 'jugador', dist: 3.6, mezcla: 0.9, dur: 1, sinEsperar: true }),
    dlg('fermin', [
      linea('No se las doy a nadie. Son de Ramón, pero las llevo yo.', { gesto: gs('senalar', 2) }),
      'Belisario me ofreció irme con las mulas al otro lado de la cordillera. Tengo hasta el invierno para contestar. Ya contesté.',
    ]),
    eleccion('majada-a-resp', '¿Qué le decís a Fermín?', [
      opcion('quedate', 'Quedate. El valle te necesita.', { efecto: 'lazo:fermin:1' }),
      opcion('propio', 'Algún día vas a tener tu propio puesto.', { sabor: true }),
      opcion('belisario', '¿Y a Belisario qué le decís?', { sabor: true }),
    ]),
    dlg('fermin', [linea('El valle no necesita a nadie en particular. Pero yo necesito el valle, que es distinto. Gracias.', { gesto: gs('asentir', 2) })], { si: siEleg('majada-a-resp', 'quedate') }),
    dlg('fermin', [linea('No lo digas muy fuerte. Si Ramón lo oye, se lo toma como una traición.', { gesto: gs('encogerse', 2) })], { si: siEleg('majada-a-resp', 'propio') }),
    dlg('fermin', ['Que gracias, pero no. Con letra más grande, que él lee mal.'], { si: siEleg('majada-a-resp', 'belisario') }),
    plano('general', { lugar: 'galpon' }, { dist: 16, alto: 4, dur: 3.4, mezcla: 0.9 }),
    narra('El galpón de esquila los recibe con el techo cargado de nieve vieja. Las ovejas entran de a poco, empujándose, y se acomodan en el corral como si siempre hubieran estado ahí.'),
    efecto('lazo:fermin:3'),
    efecto('lazo:ramon:-1'),
    efecto('mundo:fermin-lana-amiga'),
    efecto('mundo:fermin-oferta-rechazada'),
    efecto('raro:majada-llevada'),
  ],
};

const majadaVos = {
  id: 'majada-vos', titulo: 'Tres días de majada', acto: 3, capitulo: 9,
  resumen: 'Cuidaste la majada de Ramón tres días: agua y forraje al corral cada mañana, con la helada pegada al alambre. Ramón te lo agradeció con una lana; Fermín dudó, y no dijo nada.',
  personajes: pj3('ramon', 'fermin', 'narra'),
  pasos: [
    efecto('decision:majada:b'),
    plano('general', FRENTE(8, 3), { desde: 'jugador', dist: 14, alto: 3.2, dur: 3.2, mezcla: 0.9 }),
    narra('Primer día: el agua del balde con hielo, el forraje en la espalda, las ovejas mirándote como a un reemplazo. Segundo día: casi te conocen. Tercer día: una te sigue hasta la puerta.'),
    ...apagon([hora(7.5, { dur: 0 }), aparece('ramon', FRENTE(4, 2)), aparece('fermin', FRENTE(12, -5))], { dur: 1.6 }),
    plano('medio', 'ramon', { desde: 'jugador', dist: 3.4, mezcla: 0.9, dur: 3 }),
    dlg('ramon', [
      linea("Me avisaron que estás haciendo todo derecho, m'hijo. Demasiado derecho. Las ovejas se asustan de la gente que no se equivoca.", { gesto: gs('hacer-broma', 2.4) }),
      'Vine en el carro, porque la cadera me quiere ver vivo y a la vez quieto. Pero quería ver con mis ojos.',
    ]),
    plano('hombro', 'fermin', { desde: 'jugador', lado: 1, mezcla: 0.7, dur: 30, sinEsperar: true }),
    narra('Fermín mira desde lejos, sin acercarse, con el sombrero calado. Después da media vuelta con el caballo. Es una duda que no se anima a decirse.'),
    eleccion('majada-b-resp', '¿Qué le decís a Ramón?', [
      opcion('cuidar', 'Cuidarla es lo menos que puedo hacer.', { efecto: 'lazo:ramon:1' }),
      opcion('fermin', 'Fermín quería llevársela, Don Ramón.', { sabor: true }),
      opcion('descanse', 'Vuelva a la aldea, que se me enfría el mate.', { sabor: true }),
    ]),
    dlg('ramon', [linea("Sos de los que cuidan sin que se lo agradezcan. Es un oficio feo, m'hijo. Y necesario.", { gesto: gs('asentir', 2) })], { si: siEleg('majada-b-resp', 'cuidar') }),
    dlg('ramon', ['Ya sé. No es que no confíe en él. Es que si la suelto, no sé qué me queda en las manos.'], { si: siEleg('majada-b-resp', 'fermin') }),
    dlg('ramon', ['Bah. Mandón también. Hacés bien en ganarte la lana.'], { si: siEleg('majada-b-resp', 'descanse') }),
    efecto('lazo:ramon:2'),
    efecto('lazo:fermin:-1'),
    efecto('mundo:majada-vellones'),
    efecto('raro:majada-cuidada'),
  ],
};

const majadaBelisario = {
  id: 'majada-belisario', titulo: 'La majada, vendida', acto: 3, capitulo: 9,
  resumen: 'Con el papel de Ramón, llevaste la majada al Puesto del Paso y se la vendiste a Belisario. Cobraste bien; Ramón no te miró, y Fermín te dio la espalda.',
  personajes: pj3('belisario', 'fermin', 'narra'),
  pasos: [
    efecto('decision:majada:c'),
    efecto('mundo:majada-al-paso', { donde: FRENTE(14, 5) }),
    plano('general', FRENTE(8, 4), { desde: 'jugador', dist: 22, alto: 4.4, miraY: 2, dur: 3.6, mezcla: 0.9 }),
    narra('El Puesto del Paso se ve desde lejos por el humo del fogón. La majada llega como un río sucio y se frena sola contra el cerco de piedra, como si supiera.'),
    aparece('belisario', FRENTE(5, 2)),
    plano('medio', 'belisario', { desde: 'jugador', dist: 3.4, mezcla: 0.9, dur: 3 }),
    dlg('belisario', [
      linea('Doscientas cabezas y una firma de Ramón. Qué pocas veces uno vende algo tan lindo con tan poca conversación.', { gesto: gs('barba', 2.2) }),
      'Me parece que usted se va a arrepentir. Pero el negocio es el negocio.',
    ]),
    eleccion('majada-c-resp', '¿Qué le decís a Belisario?', [
      opcion('pago', 'Páguelo bien. Es de Ramón.', { sabor: true }),
      opcion('fermin', 'Fermín no tiene que enterarse por otro.', { sabor: true }),
      opcion('callar', 'Ni una palabra más, Belisario.', { sabor: true }),
    ]),
    dlg('belisario', [linea('Pago lo que vale. Lo que no vale es lo otro: lo que usted perdió en el camino.', { gesto: gs('encogerse', 2) })], { si: siEleg('majada-c-resp', 'pago') }),
    dlg('belisario', ['Los pueblos chicos se enteran solos. Pero le aviso yo, si quiere, con un modo más suave.'], { si: siEleg('majada-c-resp', 'fermin') }),
    dlg('belisario', ['Callado como una piedra. Eso sí lo entiendo.'], { si: siEleg('majada-c-resp', 'callar') }),
    ...apagon([aparece('fermin', FRENTE(16, -6))], { dur: 1.4 }),
    plano('general', FRENTE(16, -6), { desde: 'jugador', dist: 18, alto: 3.6, dur: 3, mezcla: 0.9 }),
    narra('Fermín llegó cuando el trato ya estaba hecho. Mira el corral lleno de ovejas ajenas y después te mira a vos, un segundo. Te da la espalda y se va caminando, con el caballo de las riendas.'),
    camina('fermin', FRENTE(40, -12), { vel: 1.4 }),
    efecto('lazo:ramon:-3'),
    efecto('lazo:fermin:-2'),
    efecto('mundo:cobro-majada'),
    efecto('raro:majada-vendida'),
  ],
};

const hojasCanelo = {
  id: 'hojas-canelo', titulo: 'Lo que dejaron en la puerta', acto: 3, capitulo: 9,
  resumen: 'A la mañana siguiente, en la puerta del Puesto Alto: si convidaste al valle, un atado de hojas de canelo y un yuyo pálido, y Ramón se cura un día antes; si no, la tranquera del corral abierta y las ovejas desparramadas.',
  personajes: pj3('marta', 'ramon', 'narra'),
  disparador: { hora: [5, 9] },
  pasos: [
    plano('detalle', FRENTE(1.6), { desde: 'jugador', dist: 0.9, alto: 1.1, dur: 3, mezcla: 0.9 }),
    con(narra('En el umbral, apoyado contra la puerta, un atado de hojas de canelo, anchas y verdes, con un yuyo pálido y una hebra de lana de oveja de piolín. Nadie lo trajo. Está húmedo de rocío y todavía huele a monte.'), siConvidado()),
    con(efecto('mundo:hojas-canelo', { donde: FRENTE(1.6) }), siConvidado()),
    con(efecto('duende:yuyero-de-espaldas', { tipo: 'curandero', n: 1, desde: FRENTE(6, 4), hasta: FRENTE(24, 10), deEspaldas: true, huye: true }), siConvidado()),
    con(aparece('marta', FRENTE(2.4, -1.4)), siConvidado()),
    con(plano('medio', 'marta', { desde: 'jugador', dist: 3, mezcla: 0.8, dur: 30, sinEsperar: true }), siConvidado()),
    con(dlg('marta', [
      linea('Esto es lo que yo le iba a dar. Canelo y yuyo de ladera.', { gesto: gs('senalar', 2) }),
      '¿Quién lo trajo? Hay que saber dónde buscar para encontrar este yuyo. Ni yo sé dónde buscar.',
    ]), siConvidado()),
    con(narra('Corrés a mirar y alcanzás a ver, entre los coirones, una cosita encorvada con un sombrerito de hongo que se da vuelta y huye. Después, nada.'), siConvidado()),
    con(eleccion('canelo-resp', '¿Qué le decís a Marta?', [
      opcion('callar', 'No sé quién fue. Mejor no preguntar.', { sabor: true }),
      opcion('vecino', 'Un vecino generoso, nada más.', { sabor: true }),
    ]), siConvidado()),
    dlg('marta', ['Mejor. Si es un vecino, que se quede en su rincón. Mi trabajo es que Ramón se cure, y con esto se cura un día antes.'], { si: siEleg('canelo-resp', 'callar') }),
    dlg('marta', [linea('Un vecino. Claro. Qué valle tan servicial.', { gesto: gs('hacer-broma', 2) })], { si: siEleg('canelo-resp', 'vecino') }),
    con(efecto('raro:hojas-de-canelo'), siConvidado()),
    // los que no convidaron: la tranquera abierta
    con(narra('La tranquera del corral está abierta de par en par. Las ovejas se desparramaron por la ladera como migas en un mantel, y en el barro de la entrada hay huellas chiquitas, de pie descalzo, que dan vueltas.'), no(siConvidado())),
    con(efecto('mundo:corral-abierto', { donde: FRENTE(6, 2) }), no(siConvidado())),
    con(plano('general', FRENTE(8, 3), { desde: 'jugador', dist: 18, alto: 4, dur: 3.2, mezcla: 0.9 }), no(siConvidado())),
    con(narra('No se llevaron nada. Todo está ahí, solo que mal puesto. Es una travesura, o un recado. Hay que juntar las ovejas antes de que se metan en el arroyo.'), no(siConvidado())),
    con(efecto('optativa:juntar-ovejas'), no(siConvidado())),
    con(efecto('raro:corral-abierto'), no(siConvidado())),
  ],
};

const papelElsa = {
  id: 'papel-elsa', titulo: 'El papel de Elsa', acto: 3, capitulo: 9,
  resumen: 'En el andén encontraste el pedido de traslado de Elsa, caído al piso. Se lo devolviste: ella lo guardó y, desde entonces, te dice por tu nombre. No te acostumbres.',
  personajes: pj3('elsa', 'narra'),
  pasos: [
    plano('general', { lugar: 'estacion' }, { dist: 12, alto: 3.2, dur: 3, mezcla: 0.9 }),
    aparece('elsa', { lugar: 'estacion', dx: -2, dz: 2.4 }),
    narra('Entre los durmientes, medio escondido por la nieve sucia, hay un papel doblado en cuatro. Dice «Solicito traslado a Esquel». Tiene la firma de Elsa.'),
    plano('detalle', FRENTE(1.2), { desde: 'jugador', dist: 0.8, alto: 1.1, dur: 2.8, mezcla: 0.8 }),
    plano('medio', 'elsa', { desde: 'jugador', dist: 3.2, mezcla: 0.8, dur: 30, sinEsperar: true }),
    mira('elsa', 'jugador'),
    // con el ramal a prueba o salvado: una tercera opción
    con(eleccion('papel-resp', '¿Qué hacés con el papel?', [
      opcion('sin-decir', 'Devolvérselo sin decir nada.', { efecto: 'lazo:guarda:1' }),
      opcion('cuenta', 'Devolvérselo: «la cuenta del ramal va bien».', { efecto: 'lazo:guarda:2' }),
      opcion('despues', 'Guardarlo y devolvérselo mañana.', { sabor: true }),
    ]), no(siRamal('traslado'))),
    con(eleccion('papel-bajo', '¿Qué hacés con el papel?', [
      opcion('sin-decir', 'Devolvérselo sin decir nada.', { efecto: 'lazo:guarda:1' }),
      opcion('despues', 'Guardarlo y devolvérselo mañana.', { sabor: true }),
    ]), siRamal('traslado')),
    dlg('elsa', [
      linea('Usted no vio nada, pasajero.', { gesto: gs('encogerse', 2) }),
      '…Gracias. Ya no le digo pasajero, ¿eh? Le digo por el nombre. Pero no se acostumbre.',
    ], { si: siEleg('papel-resp', 'sin-decir') }),
    dlg('elsa', [
      linea('¿Va bien? ¿De verdad va bien?', { gesto: gs('mirar', 2) }),
      'Usted no es de los que dicen cosas para quedar bien. Entonces lo creo. Y no me haga hablar, que se me corre el rodete.',
    ], { si: siEleg('papel-resp', 'cuenta') }),
    dlg('elsa', ['Mañana, mañana. Todo es mañana en este ramal. Mientras tanto, guarde el secreto como si fuera de usted.'], { si: siEleg('papel-resp', 'despues') }),
    dlg('elsa', [
      linea('Usted no vio nada, pasajero.', { gesto: gs('encogerse', 2) }),
      '…Gracias. Ya no le digo pasajero, ¿eh? Le digo por el nombre. Pero no se acostumbre.',
    ], { si: siEleg('papel-bajo', 'sin-decir') }),
    dlg('elsa', ['Mañana, mañana. Todo es mañana en este ramal.'], { si: siEleg('papel-bajo', 'despues') }),
    efecto('raro:papel-de-elsa'),
  ],
};

const visitaRamon = {
  id: 'visita-ramon', titulo: 'Una visita al puesto sanitario', acto: 3, capitulo: 9,
  resumen: 'Le llevaste a Ramón algo rico al puesto sanitario de la aldea. Hablaron de Chocolate, el perro que se le murió, y él se dejó cuidar un rato.',
  personajes: pj3('ramon', 'marta', 'narra'),
  pasos: [
    plano('medio', 'ramon', { desde: 'jugador', dist: 3.6, dur: 3, mezcla: 0.9 }),
    aparece('ramon', FRENTE(3, 0.6)),
    pose('ramon', 'brindar', { dur: 1.6 }),
    narra('El puesto sanitario tiene una estufa a leña, una camilla y un almanaque del año pasado que nadie se animó a sacar. Ramón está en una silla, con la manta, mirando el techo con cara de querer ver ovejas.'),
    dlg('ramon', [
      linea("Ah, m'hijo. Pasá.", { gesto: gs('saludar', 1.8) }),
      'Me traés cosas ricas. Esto es soborno, y yo no lo acepto. Bueno, lo acepto.',
    ]),
    plano('primer', 'ramon', { desde: 'jugador', mezcla: 0.8, dur: 30, sinEsperar: true }),
    dlg('ramon', [
      'Tuve un perro. Chocolate. Pardo, con una mancha blanca en el pecho. Me seguía a todos lados menos al corral, que lo odiaba.',
      linea('El día que se murió bajé con la majada igual. Era lo único que sabía hacer. Hoy no puedo, y me quedo mirando la pared.', { gesto: gs('suspirar', 2.6) }),
    ]),
    eleccion('visita-resp', '¿Qué le decís a Ramón?', [
      opcion('chocolate', 'Chocolate habría querido que lo cuiden a usted.', { efecto: 'lazo:ramon:1' }),
      opcion('relato', 'Cuénteme más de Chocolate.', { sabor: true }),
      opcion('mate', 'Cebo yo el mate, Don Ramón.', { sabor: true }),
    ]),
    dlg('ramon', [linea('Capaz. Capaz tenés razón. Los perros saben más de eso que uno.', { gesto: gs('asentir', 2) })], { si: siEleg('visita-resp', 'chocolate') }),
    dlg('ramon', ['Le gustaba la pizca de sal en la mano. Se la daba cada tarde, a las seis. Todavía a las seis me pica la mano.'], { si: siEleg('visita-resp', 'relato') }),
    dlg('ramon', ['Cebá, cebá. Lavado no. Bien cargado.'], { si: siEleg('visita-resp', 'mate') }),
    efecto('raro:chocolate'),
  ],
};

export const ESCENAS_C9 = {
  'ramon-cama': ramonEnCama,
  'fermin-tranquera': ferminTranquera,
  'majada-fermin': majadaFermin,
  'majada-vos': majadaVos,
  'majada-belisario': majadaBelisario,
  'hojas-canelo': hojasCanelo,
  'papel-elsa': papelElsa,
  'visita-ramon': visitaRamon,
};
export const EFECTOS_C9 = [...new Set(Object.values(ESCENAS_C9).flatMap((e) => efectosDe(e)))].sort();
