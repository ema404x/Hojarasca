// 4.16.0 (B): ACTO II · capítulo 6 «Lo que se pierde, aparece» (GUION_HISTORIA.md). Ocho escenas como datos. El misterio crece: las luces
// del lago, el lechucero, la guardia en el molino (con la noche de las piedritas si se taló el coihue), las huellas y la yerba de Ramón.
// Variantes por D1 (la bolsa: la masa de Rosa) y D2 (el coihue: saludan o tiran bellotas).
import { efectosDe, dlg, narra, linea, gs, hombro, plano, pose, aparece, camina, mira, desaparece, espera, sonido, efecto, opcion, eleccion, siEleg, siDecision } from './historia-escenas-util.js';
import { pj, FRENTE, apagon, hora, horaMas, con, no } from './historia-escenas-acto2-util.js';

const primerDe = (a, o = {}) => ({ plano: 'primer', a, desde: 'jugador', mezcla: 0.7, dur: 30, sinEsperar: true, ...o });
const tocon = siDecision('coihue', 'b');
const hayRaiz = no(siDecision('coihue', 'b'));
// donde está el coihue (o su tocón) mirando desde el banco del molino
const RAIZ = FRENTE(22, -5);

const lucesNicanor = {
  id: 'luces-lago-nicanor', titulo: 'Las luces del lago', acto: 2, capitulo: 6,
  resumen: 'En el muelle, al atardecer, Nicanor te explicó cómo ver las luces del lago: en kayak, despacito, sin remar fuerte, y llegando sin avisar.',
  personajes: pj('nicanor', 'narra'),
  disparador: { hora: [19.5, 21.5] },
  pasos: [
    plano('general', { lugar: 'muelle' }, { dist: 15, alto: 3.4, dur: 3.2, mezcla: 0.9 }),
    narra('El sol se va por el lado de la cordillera y el faro, lejos, es un puntito. El agua está tan quieta que parece una segunda tarde puesta cabeza abajo.'),
    aparece('nicanor', { lugar: 'muelle', dx: -2.5, dz: 1.2 }),
    plano('medio', 'nicanor', { desde: 'jugador', mezcla: 0.9, dur: 1, sinEsperar: true }),
    dlg('nicanor', [
      linea('Salen cerca del faro, a eso de la medianoche.', { gesto: gs('senalar', 2) }),
      'Si vas en el kayak despacito y no remás fuerte, las ves. Si remás fuerte, se apagan. Como las truchas: hay que llegar sin avisar.',
      linea('Y no les saques foto. Mentira. Sacales. A ver si te sale.', { gesto: gs('hacer-broma', 2) }),
    ]),
    eleccion('luces-resp', '¿Qué le contestás a Nicanor?', [
      opcion('que', '¿Y qué son esas luces?', { sabor: true }),
      opcion('kayak', 'Esta noche voy en el kayak.', { sabor: true }),
      opcion('foto', '¿Alguien les sacó una foto alguna vez?', { sabor: true }),
    ]),
    dlg('nicanor', [linea('Si lo supiera, no iría con la caña: iría con un cuaderno. Yo solo las miro. Con respeto.', { gesto: gs('encogerse', 2) })], { si: siEleg('luces-resp', 'que') }),
    dlg('nicanor', [linea('Llevate abrigo, que en el agua la noche pica. Y no cantes: les gusta el silencio.', { gesto: gs('asentir', 1.8) })], { si: siEleg('luces-resp', 'kayak') }),
    dlg('nicanor', ['Sofía, la fotógrafa. Le salió una mancha. Dice que la mancha la miró. Yo no digo nada, vos fijate.'], { si: siEleg('luces-resp', 'foto') }),
    efecto('raro:luces-faro-medianoche'),
  ],
};

const elQueVuela = {
  id: 'el-que-vuela', titulo: 'El que vuela', acto: 2, capitulo: 6,
  resumen: 'De noche, en el lago cerca del faro, contra la luna pasó una silueta de lechuza con algo chiquito montado, y tres lucecitas ámbar la siguieron sobre el agua hasta apagarse de a una.',
  personajes: pj('narra'),
  disparador: { hora: [23, 25] },
  pasos: [
    sonido('anotar'),
    plano('hombro', { lugar: 'faro' }, { desde: 'jugador', atras: 0, costado: 0, miraY: 9, alto: 0.9, fov: 58, mezcla: 0.9, dur: 3.4 }),
    narra('Remás despacito. El agua no hace ruido. El faro está ahí, negro, y arriba la luna es una uña grande.'),
    efecto('duende:lechucero-vuela', { tipo: 'volador', desde: { frente: 'jugador', dist: 40, lado: -18 }, hasta: { frente: 'jugador', dist: 40, lado: 22 }, contraLuna: true }),
    espera(2.6),
    narra('Una silueta cruza la luna. Una lechuza, creés. Pero arriba de la lechuza hay algo chiquito, sentado derecho, como un jinete.'),
    efecto('duende:enjambre-lago', { tipo: 'enjambre', n: 3, sobre: { frente: 'jugador', dist: 24, lado: 4 }, seApagan: true }),
    espera(3),
    plano('picado', FRENTE(24, 4), { desde: 'jugador', dist: 6, alto: 5.5, dur: 3.2, mezcla: 0.9 }),
    narra('Tres lucecitas ámbar la siguen sobre el agua. Se apagan de a una. La última se queda un segundo de más, como si te mirara.'),
    eleccion('vuela-resp', '¿Qué hacés?', [
      opcion('foto', 'Sacar la foto, rápido.', { efecto: 'objeto:foto-movida' }),
      opcion('mirar', 'Quedarte mirando, sin moverte.', { sabor: true }),
      opcion('remar', 'Remar fuerte hacia donde se apagaron.', { sabor: true }),
    ]),
    con(narra('Salió como sale todo lo que importa: movida. Tres manchas doradas sobre un fondo negro, y algo que parece, si uno quiere, la punta de un ala.'), siEleg('vuela-resp', 'foto')),
    con(narra('No te movés. Después de un rato el lago vuelve a ser lago. Pero te llevás la imagen puesta, y eso no se mueve por más que quieras.'), siEleg('vuela-resp', 'mirar')),
    con(narra('Cuando la pala golpea el agua, las lucecitas que quedaban se apagan todas juntas. Nicanor tenía razón. Siempre la tiene con esas cosas.'), siEleg('vuela-resp', 'remar')),
    efecto('raro:lechucero-faro'),
    con(efecto('raro:foto-movida'), siEleg('vuela-resp', 'foto')),
  ],
};

const guardiaMolino = {
  id: 'guardia-molino', titulo: 'La guardia del molino', acto: 2, capitulo: 6,
  resumen: 'Hiciste guardia de noche en el banco del molino. A las doce y cuarenta empezaron a asomar siluetas chiquitas entre las raíces del coihue (o, si lo talaste, te tiraron bellotas al techo toda la noche).',
  personajes: pj('narra'),
  disparador: { hora: [22, 26] },
  pasos: [
    ...apagon([hora(22.6, { dur: 0 })], { dur: 2 }),
    plano('fijo', RAIZ, { desde: 'jugador', encuadre: 'general', dist: 9, alto: 2.2, miraY: 2.6, dur: 3.4, mezcla: 0.9 }),
    narra('Te sentás en el banco del molino, con el farol a tus pies y un mate frío. La muela duerme. El arroyo habla bajito, para no despertarla.'),
    horaMas(2.1, { dur: 7, sinEsperar: true }),
    espera(4),
    con(narra('Alguien dio una vuelta de llave: de repente es tarde. A las doce y cuarenta, por una raíz del coihue, se asoma una silueta del tamaño de un gato grande.'), hayRaiz),
    con(efecto('duende:siluetas-raiz', { tipo: 'rastreador', n: 5, desde: RAIZ, escalonado: true }), hayRaiz),
    con(plano('primer', RAIZ, { desde: 'jugador', dist: 6, alto: 1.1, miraY: 0.9, fov: 38, dur: 3.2, mezcla: 0.8 }), hayRaiz),
    con(narra('Después otra. Después dos más. Después cinco, quietas, de pie entre las raíces, con las cabezas de lado. Te miran. Los ojos les brillan apenas, como un fósforo lejos.'), hayRaiz),
    con(efecto('duende:siluetas-saludan', { n: 1 }), hayRaiz),
    con(narra('Uno, el de adelante, levanta la mano. La mueve una vez, despacio. Así se saluda a alguien a quien todavía no se conoce.'), hayRaiz),
    con(eleccion('guardia-resp', '¿Cómo respondés al saludo?', [
      opcion('mano', 'Levantar la mano, despacito.', { sabor: true }),
      opcion('quieto', 'Quedarte quieto, sin respirar fuerte.', { sabor: true }),
      opcion('pararte', 'Pararte de golpe para verlos mejor.', { efecto: 'duende:siluetas-corren' }),
    ]), hayRaiz),
    con(narra('Lo devolvés. El de adelante inclina la cabeza un grado, no más, y se queda. Es el saludo más formal que te hicieron en la vida.'), siEleg('guardia-resp', 'mano')),
    con(narra('Te quedás tan quieto que el banco te cree parte de él. Ellos también se quedan. Se miran unos a otros, y después otra vez a vos. Parece una reunión.'), siEleg('guardia-resp', 'quieto')),
    con(narra('Apenas te levantás, corren. Se hunden entre las raíces como si el árbol los hubiera tragado. Queda el crujido de una hoja seca y nada más.'), siEleg('guardia-resp', 'pararte')),
    // si se taló el coihue: la noche de las piedritas
    con(narra('Ni una silueta. Una bellota pega en la chapa del molino. Otra. Otra más fuerte. Alguien tira desde donde estaba el coihue, desde la oscuridad del tocón.'), tocon),
    con(efecto('duende:pillos-bellotas', { tipo: 'rastreador', n: 3, tiran: 'bellotas', alTecho: true, desde: RAIZ }), tocon),
    con(plano('picado', FRENTE(2), { desde: 'jugador', dist: 3, alto: 7, dur: 3, mezcla: 0.8 }), tocon),
    con(narra('Tac. Tac. Tac, tac, tac. Toda la noche, parejo, sin rabia: como un reloj de mal humor. No hacen daño. Pero tampoco dejan dormir.'), tocon),
    con(eleccion('guardia-tocon', '¿Qué hacés con las bellotas?', [
      opcion('aguantar', 'Aguantar sin responder.', { sabor: true }),
      opcion('devolver', 'Tirar una bellota de vuelta, hacia el tocón.', { sabor: true }),
    ]), tocon),
    con(narra('Aguantás. A las cuatro empieza a aflojar. A las cinco, ni una. En la chapa quedó un montoncito de bellotas, como una cuenta que alguien dejó hecha.'), siEleg('guardia-tocon', 'aguantar')),
    con(narra('La bellota vuela, no llega a nada y cae. Silencio largo. Después, desde el tocón, una risa cortita, indignada. Y siguen. Pero un rato más despacio.'), siEleg('guardia-tocon', 'devolver')),
    sonido('anotar'),
    con(efecto('raro:guardia-saludo'), hayRaiz),
    con(efecto('raro:noche-piedritas'), tocon),
  ],
};

const huellasEscarcha = {
  id: 'huellas-escarcha', titulo: 'Las huellas', acto: 2, capitulo: 6,
  resumen: 'A la mañana, desde el molino, seguiste unas huellas chiquitas en la escarcha que subían por la ladera hasta una raíz donde alguien dejó un puñado de yerba prolijo sobre una hoja de nalca.',
  personajes: pj('narra'),
  disparador: { hora: [6, 8.5] },
  pasos: [
    ...apagon([hora(6.9, { dur: 0 }), efecto('mundo:huellas-escarcha', { desde: FRENTE(3), hasta: FRENTE(26, 11) })], { dur: 2 }),
    plano('detalle', FRENTE(3), { desde: 'jugador', dist: 0.9, alto: 1.1, dur: 3, mezcla: 0.9 }),
    narra('La escarcha cubre el pasto como azúcar. Y en la escarcha, huellas. Chiquitas, de pie descalzo, apenas más grandes que una moneda. Brillan un poco más que lo de alrededor.'),
    plano('paneo', FRENTE(3), { hasta: FRENTE(26, 11), dist: 8, alto: 3, dur: 4.4, mezcla: 0.9 }),
    narra('Se alejan del molino, suben por la ladera y se pierden hacia los árboles del Puesto Alto. Las seguís. No corren: caminan, como quien vuelve a casa de una fiesta.'),
    eleccion('huellas-resp', '¿Qué pensás mientras las seguís?', [
      opcion('quien', '¿Quién camina descalzo con este frío?', { sabor: true }),
      opcion('callar', 'No decir nada. Seguir.', { sabor: true }),
    ]),
    con(narra('Alguien que no siente el frío. O que no es de acá, o que es más de acá que cualquiera. No te animás a elegir.'), siEleg('huellas-resp', 'quien')),
    con(narra('El único ruido es tu respiración haciendo nubes. A veces es mejor no preguntar nada para que algo conteste.'), siEleg('huellas-resp', 'callar')),
    efecto('mundo:yerba-en-raiz', { donde: FRENTE(26, 11) }),
    plano('primer', FRENTE(26, 11), { desde: 'jugador', dist: 1.8, alto: 1.2, miraY: 0.5, dur: 3.4, mezcla: 0.9 }),
    narra('Las huellas terminan en una raíz gruesa, de pehuén. Sobre la raíz, una hoja de nalca, y sobre la hoja, un puñado de yerba puesto con prolijidad de almacenero. Todavía no tiene escarcha.'),
    efecto('raro:huellas-escarcha'),
    efecto('raro:yerba-en-raiz'),
  ],
};

const ramonRaiz = {
  id: 'ramon-raiz', titulo: 'Ramón en la raíz', acto: 2, capitulo: 6,
  resumen: 'Escondido detrás de un árbol, viste a Don Ramón agacharse, dejar un puñado de yerba en una raíz, sacarse la boina un segundo y irse. No te vio.',
  personajes: pj('ramon', 'narra'),
  disparador: { hora: [7, 8.5] },
  pasos: [
    plano('general', FRENTE(16, -4), { desde: 'jugador', dist: 16, alto: 2.4, miraY: 1.2, dur: 3, mezcla: 0.9 }),
    narra('Te quedás detrás de un pehuén, a quince pasos. Desde ahí se ve la raíz, y por el camino de la ladera baja alguien con boina y poncho.'),
    aparece('ramon', FRENTE(22, 5)),
    camina('ramon', FRENTE(16.5, -3.5), { vel: 1.0 }),
    plano('medio', 'ramon', { desde: 'jugador', dist: 9, alto: 1.4, miraY: 1.2, fov: 40, mezcla: 0.9, dur: 1, sinEsperar: true }),
    pose('ramon', 'tocar', { dur: 2.6, sinEsperar: false }),
    narra('Don Ramón se agacha, despacio, con el trabajo que le cuestan ahora las rodillas. Deja un puñado de yerba en la raíz. Lo acomoda con dos dedos.'),
    pose('ramon', 'gorro', { dur: 2.4, sinEsperar: false }),
    narra('Se saca la boina. Un segundo largo, quieto, con la cabeza gacha. Después se la pone otra vez, se calza el poncho y vuelve por donde vino, sin apuro, sin mirar atrás.'),
    camina('ramon', FRENTE(24, 6), { vel: 1.0 }),
    desaparece('ramon'),
    narra('No te vio. Vos no te moviste. Hay cosas que en el valle se saben de costado.'),
    efecto('raro:ramon-yerba'),
  ],
};

const perdidasDevueltas = {
  id: 'perdidas-devueltas', titulo: 'Las cosas perdidas', acto: 2, capitulo: 6,
  resumen: 'Le llevaste a Ercilia el dedal, la pipa de Belisario y la cuchara de Rosa, que aparecieron en lugares imposibles. Ercilia dijo «gracias» mirando para el bosque.',
  personajes: pj('ercilia', 'nelida', 'narra'),
  pasos: [
    sonido('bisagra'),
    plano('medio', 'ercilia', { desde: 'jugador', dist: 3.4, dur: 2.8, mezcla: 0.9 }),
    mira('ercilia', 'jugador'),
    mira('nelida', 'jugador'),
    dlg('ercilia', [
      linea('¡Mi dedal!', { gesto: gs('sorprenderse', 1.6) }),
      '¿Dónde estaba, querido? Lo busqué en las cajas, en los bolsillos, hasta en la lata de las pastillas.',
      'Arriba de un poste del andén. Arriba. De un poste. ¿Quién sube a un poste a poner un dedal?',
    ]),
    efecto('entrega:dedal-ercilia'),
    efecto('entrega:pipa-belisario'),
    efecto('entrega:cuchara-rosa'),
    sonido('juntar'),
    dlg('ercilia', [
      'Y la pipa de Belisario, en la vía del faro. Y la cuchara de palo de Rosa, adentro de una bota. Alguien hizo una tarde muy rara con tantas cosas ajenas.',
      'Yo las paso. Que cada uno recupere lo suyo y se calle la boca.',
    ]),
    eleccion('perdidas-resp', '¿Qué le decís a Ercilia?', [
      opcion('raros', 'Estaban en lugares imposibles.', { sabor: true }),
      opcion('quien', '¿Quién las habrá movido?', { sabor: true }),
      opcion('cuidado', 'Capaz las devolvieron con cuidado, no para molestar.', { efecto: 'lazo:ercilia:1' }),
    ]),
    dlg('ercilia', [linea('Imposibles, sí. Ni los chicos llegan ahí.', { gesto: gs('negar', 1.8) })], { si: siEleg('perdidas-resp', 'raros') }),
    dlg('nelida', ['Yo no digo nada. Pero la cuchara de Rosa estaba tibia.'], { si: siEleg('perdidas-resp', 'quien') }),
    dlg('ercilia', [linea('Con cuidado. Qué manera tuya de decir las cosas. Capaz tengas razón.', { gesto: gs('asentir', 1.8) })], { si: siEleg('perdidas-resp', 'cuidado') }),
    plano('hombro', FRENTE(30, -14), { desde: 'jugador', atras: 0, costado: 0, miraY: 1.3, alto: 1.65, mezcla: 0.8, dur: 3 }),
    dlg('ercilia', [linea('Gracias.', { gesto: gs('juntas', 2) })]),
    narra('Lo dice mirando para el bosque, a través de la ventana. No a vos: al bosque.'),
    efecto('raro:cosas-perdidas'),
  ],
};

const masaCrece = {
  id: 'masa-crece', titulo: 'La masa que crece sola', acto: 2, capitulo: 6,
  resumen: 'En la panadería, Rosa te mostró su masa madre crecida hasta el techo y con marcas de deditos. Pasaste la noche ahí: solo viste la puerta del horno cerrarse sola. Rosa te enseñó el pan casero.',
  personajes: pj('rosa', 'narra'),
  pasos: [
    plano('medio', 'rosa', { desde: 'jugador', dist: 3.4, dur: 3, mezcla: 0.9 }),
    mira('rosa', 'jugador'),
    dlg('rosa', [
      linea('Mirá esto. Mirá.', { gesto: gs('senalar', 2) }),
      'Anoche la dejé en la batea, así de alta. Esta mañana llegó hasta el techo. Y mirá las marcas: son deditos. ¡Deditos!',
      'Yo no le tengo miedo a nada. Pero quiero que me acompañes una noche, por si acaso.',
    ]),
    ...apagon([hora(23.6, { dur: 0 })], { dur: 2 }),
    plano('general', FRENTE(3), { desde: 'jugador', dist: 6, alto: 2.4, dur: 3, mezcla: 0.9 }),
    narra('La panadería de noche huele a levadura y a ceniza. Rosa duerme en una silla con el delantal puesto. Vos mirás el horno de reojo. Pasa una hora. Pasan dos.'),
    horaMas(2.8, { dur: 5, sinEsperar: true }),
    espera(3),
    plano('detalle', FRENTE(3, 0.6), { desde: 'jugador', dist: 1.3, alto: 1.2, dur: 3, mezcla: 0.8 }),
    efecto('mundo:horno-se-cierra'),
    sonido('bisagra'),
    narra('A las tres menos veinte, la puerta del horno, que estaba abierta, se cierra sola. Despacito, sin golpe, como cuando cerrás una puerta para no despertar a nadie.'),
    mira('rosa', 'jugador'),
    dlg('rosa', [
      linea('...¿Viste? Yo vi.', { gesto: gs('susurrar', 2) }),
      linea('Mirá, si quieren pan, que pidan. Yo le doy pan a todo el que pide. Pero que no me toquen la masa madre, que es de 1987.', { gesto: gs('amasar', 2.4), plano: primerDe('rosa') }),
    ]),
    eleccion('masa-resp', '¿Qué le decís a Rosa?', [
      opcion('pan', 'Dejémosles un pan en la repisa.', { sabor: true }),
      opcion('ensenar', 'Enseñame a hacer pan casero.', { sabor: true }),
    ]),
    dlg('rosa', [linea('Un pan. Chiquito, para su tamaño. Mañana lo hacemos.', { gesto: gs('asentir', 1.8) })], { si: siEleg('masa-resp', 'pan') }),
    dlg('rosa', ['Con la harina de Eusebio, ni hace falta técnica. Pero te la enseño: una parte de agua tibia, dos de harina, sal y paciencia. La paciencia es lo más difícil.'], { si: siEleg('masa-resp', 'ensenar') }),
    efecto('mundo:receta-pan-casero'),
    efecto('dar:pan-casero:2'),
    efecto('lazo:rosa:1'),
    efecto('raro:masa-crece'),
  ],
};

const fotoSofia = {
  id: 'foto-sofia', titulo: 'Foto para Sofía', acto: 2, capitulo: 6,
  resumen: 'Le llevaste la foto movida a Sofía, la fotógrafa del estudio, que la miró un buen rato y dijo que no era una mancha: era un ojo.',
  personajes: pj('sofia', 'narra'),
  pasos: [
    plano('medio', 'sofia', { desde: 'jugador', dist: 3.4, dur: 3, mezcla: 0.9 }),
    mira('sofia', 'jugador'),
    dlg('sofia', [
      linea('Dejame ver eso.', { gesto: gs('mirar', 1.6) }),
      'Está movida. Muy movida. Bien movida: no hay una sola cosa nítida.',
    ]),
    plano('detalle', FRENTE(1), { desde: 'jugador', dist: 0.8, alto: 1.2, dur: 3.2, mezcla: 0.8 }),
    narra('Sofía acerca la foto a la luz de la ventana, la aleja, la acerca otra vez. Con una lupa señala una de las manchas doradas.'),
    dlg('sofia', [
      linea('Esto no es una mancha.', { gesto: gs('senalar', 2) }),
      linea('Esto es un ojo.', { plano: primerDe('sofia') }),
      'Fijate la pupila, pequeña, vertical. Y los reflejos de la luna a los dos lados. Yo en dieciséis años de foto nunca vi una mancha con reflejos.',
    ]),
    eleccion('sofia-resp', '¿Qué le decís?', [
      opcion('ojo', 'Un ojo de lechuza, seguro.', { sabor: true }),
      opcion('guardar', '¿La puedo guardar en el cuaderno?', { sabor: true }),
    ]),
    dlg('sofia', [linea('Una lechuza con una pupila de duende. Dejame hacerte una copia, que la tuya se va a gastar.', { gesto: gs('hacer-broma', 2) })], { si: siEleg('sofia-resp', 'ojo') }),
    dlg('sofia', ['Claro. Y me dejás una copia para mí. En la pared del estudio no la voy a poner, que la gente pregunta. En un cajón.'], { si: siEleg('sofia-resp', 'guardar') }),
    efecto('raro:foto-ojo'),
  ],
};

export const ESCENAS_C6 = {
  'luces-lago-nicanor': lucesNicanor,
  'el-que-vuela': elQueVuela,
  'guardia-molino': guardiaMolino,
  'huellas-escarcha': huellasEscarcha,
  'ramon-raiz': ramonRaiz,
  'perdidas-devueltas': perdidasDevueltas,
  'masa-crece': masaCrece,
  'foto-sofia': fotoSofia,
};
export const EFECTOS_C6 = [...new Set(Object.values(ESCENAS_C6).flatMap((e) => efectosDe(e)))].sort();
