// 3.9.2 · LUCRECIA, DALIA Y CEINWEN MÁS VIVAS: lo que dicen y hacen mientras atienden, bailan o conversan (sólo texto y comportamiento; el cuerpo de cada una es de gente-cuerpo.js
// y gente-ropa.js). Módulo puro: bancos de frases con memoria (que no se repitan seguido) y las dos poses nuevas de las manos (saludar con la mano en alto y secar un vaso), que
// se agregan a las de la peña (POSES_BAILE, que se mueven con el tiempo). Picante sólo sugerido, nada explícito. Sin inglés todavía (a pedido del usuario): lo nuevo está
// listado en CAMBIOS_3_9_2C.md.
import { POSES_BAILE } from './gente-cuerpo.js';

const sen = Math.sin;
// Un saludo con la mano en alto (el codo ondulando) y la otra en la cintura; secar un vaso con las dos manos adelante (se frotan despacito)
POSES_BAILE.saludar = (t) => {
  const k = sen(t * 7.5);
  return { der: { x: -2.7, yl: 0.3, zl: 0.3, codo: -0.55 + k * 0.45 }, izq: { x: 0.08, yl: -1.4, zl: 0.5, codo: -1.6 }, torso: { x: 0, z: 0.03, y: 0.05 }, cabeza: { x: -0.05, y: 0.12, z: -0.06 } };
};
POSES_BAILE.secar = (t) => {
  const k = sen(t * 4.2);
  return { der: { x: -0.95, yl: -0.55, zl: 0.12, codo: -1.45 + k * 0.18 }, izq: { x: -0.85, yl: -0.55, zl: 0.12, codo: -1.4 - k * 0.18 }, torso: { x: 0.03, z: 0, y: 0 }, cabeza: { x: 0.12, y: 0.15, z: 0 } };
};
export const POSES_VIDA = ['saludar', 'secar'];

const eleg = (lista, semilla) => lista[Math.abs(Math.floor(semilla)) % lista.length];
const llenar = (t, ...v) => v.reduce((s, x, i) => s.split(`{${i}}`).join(x), t);

// ---------------------------------------------------------------- Lucrecia, la moza de la cantina
export const MOZA = {
  // al verte llegar, desde la barra, con la mano en alto ({0}: tu apodo en la aldea, o «forastero»)
  entrada: ['¡{0}! Pasá, que se enfría la noche.', 'Mirá quién entra. Hoy la barra tiene buena cara.', '¡Buenas, {0}! Te guardé el mejor lugar. Bueno, el menos peor.', 'Adelante, {0}. La puerta no muerde; yo, depende.', 'Ahí está {0}. Sentate donde quieras, que la mesa del fondo es de los tímidos.'],
  entradaTarde: ['Qué temprano, {0}. Todavía estoy encendiendo la salamandra, pero pasá.', 'Llegaste antes que la gente, {0}. Eso te da derecho a elegir la mejor silla.'],
  // lo que comenta mientras estás sentado, sin que se lo pidas: por el momento (la categoría) y con memoria
  comentarios: {
    general: ['Si necesitás algo, levantá la mano. Yo veo todo desde la barra, siempre.', 'No te apures con el pedido. Esta noche tenemos tiempo.', 'Esta mesa es de las buenas: se ve la puerta y se oye la guitarra.', 'En la cantina el que se sienta, se queda. Es la ley de la casa.'],
    noche: ['Las noches largas son las que mejor se sirven.', 'A esta hora la cantina tiene otra voz: más grave, más sincera.', 'Cuando se llena así, es que alguien trae una historia que contar.'],
    madrugada: ['Después de medianoche se sirve más despacio y se dice más verdad.', 'Quedan los de siempre y los que no tienen a quién volver. Los míos.'],
    lluvia: ['Escuchá la lluvia en la chapa. Es la mejor música que tiene este boliche, y la única gratis.', 'Con esta lluvia nadie se anima a volver a casa temprano. Negocio redondo.'],
    nieve: ['Si sigue nevando nos quedamos todos encerrados. No me quejo.', 'La nieve pone callado al pueblo; la cantina, no.'],
    viento: ['El viento de la meseta no pregunta: entra, mueve las velas y se va.'],
    reloj: ['Ese reloj de la pared atrasa cinco minutos, como el tren. A mí me conviene: la noche rinde más.', 'El reloj me lo regaló un cliente que se fue sin pagar. Sigue marcando la hora a su manera.'],
    cuadros: ['El cuadro del lago lo pintó un viajero que no tenía con qué pagar la cuenta. Quedamos a mano, y yo con la mejor parte.', 'La herradura de arriba de la puerta la colgó mi tío, con la punta para arriba para que no se escape la suerte. Hasta ahora, no se escapó.'],
    cartel: ['El cartel de «hoy no se fía» lo escribí yo. Ese «mañana sí» es lo que mantiene unida a la clientela.'],
    musica: ['La guitarrita de fondo la pongo yo, bajito, para que los silencios no se pongan incómodos.', 'Hay noches en que la mejor música es la que no se nota: la de los vasos y las risas.'],
    salamandra: ['La salamandra tira humo para el lado que quiere, como los clientes: no hay manual.', 'Arrimate a la salamandra si te da frío; la que me da calor a mí es otra cosa, pero eso no figura en la carta.'],
    // {0}: el nombre de uno de los que están en la cantina
    parroquiano: ['{0} ya va por la tercera y todavía no se animó a contarme lo que le pasa.', 'Mirá a {0}: nunca lo vi decir que no a un truco. Ni a un fiado.', '{0} viene siempre a esta hora y se sienta en la misma silla. Yo le pongo la sal sin que me lo pida.'],
    // {0}: lo último que pediste
    ultimo: ['¿Sabés que me acuerdo de lo último que pediste? {0}. Una buena moza siempre se acuerda.', 'Lo tuyo fue {0}, ¿no? Se me graban los pedidos… y alguna que otra mirada.'],
    // con confianza (amigo o más): más cercana y más picante, nunca explícita
    confianza: ['Me gusta que te quedes un rato. Los que se quedan son los que valen la pena.', 'No se lo digas a nadie, pero tu mesa es la que mejor atiendo.', 'Cuando te veo sentado ahí, la noche se me pasa más rápido. Algo tendrás.'],
    picante: ['Si te da calor, te traigo otra jarra. Si te da otra cosa, avisame y lo conversamos.', 'Hoy hace una noche de esas en que cualquiera dice cosas que mañana no recuerda. Yo recuerdo todas.', 'Con esa mirada, pedí lo que quieras: lo que no tengo en la carta, lo invento.'],
  },
  // cuando una vez terminaste de comer o tomar y seguís sentado
  sobremesa: ['¿Otra, o te quedás conversando? Las dos cosas se pueden.', 'Te veo cómodo. Eso en esta casa se cobra… con una sonrisa.', 'Cuando quieras otra ronda, ya sabés: levantá la mano, que la barra te escucha.'],
  // lo que dice al ver lo que pediste (los platos y bebidas nuevos); si es el plato del día, le agrega lo suyo
  reaccion: {
    'fernet-cola': 'Fernet con cola, la bebida de los valientes. Con hielo de la cueva, que es lo único frío que tengo.',
    'licor-calafate': 'Ese lo hago yo, con calafate de la loma. Dicen que el que lo prueba vuelve. Yo creo que vuelve el que lo prueba bien.',
    'cerveza-negra': 'Negra como la noche y con la espuma que se merece.',
    sidra: 'Sidra de las manzanas del valle. Ligerita: ideal para el que quiere seguir hablando.',
    'vino-caliente': 'Vino caliente: se toma de a sorbos y se perdona de a gotas.',
    cafe: 'Café para el que todavía tiene camino… o para el que no quiere perder el hilo de la charla.',
    limonada: 'Limonada helada, para los que se ahogan de calor y de verano.',
    milanesa: 'Una milanesa grande: promete mucho y cumple todo.',
    choripan: 'Choripán con chimichurri: lo único de la carta que se come con las manos y sin pedir disculpas.',
    locro: 'Locro de la casa: el que lo prueba una vez, lo pide para siempre.',
    cordero: 'Cordero al asador. Plato de las ocasiones: ¿hoy es una?',
    'sopa-huerta': 'Sopa de la huerta: sencilla, de las que reconcilian.',
    'tarta-fruta': 'Tarta de la fruta de acá. La masa me sale quebrada; el carácter, también.',
    flan: 'Flan con dulce de leche: se pide dos veces, la segunda con culpa.',
    'pan-queso': 'Pan, queso y dulce: la merienda de los que saben.',
  },
  delDia: ['Y encima es el plato del día: la cocinera lo hizo con ganas y con lo que dio la aldea.', 'Hoy es el plato del día, con rebaja. Los que preguntan el precio se lo pierden.'],
  // «Charlar un rato»: lo que cuenta cuando se lo pedís (sin la historia de siempre: acá, de cosas de la barra)
  charlas: [
    'Mi madre decía que una moza se hace en tres años y se deshace en una noche. Yo llevo diez y sigo entera.',
    'Los que entran con cara de funeral salen contando chistes. Ése es mi sueldo mayor.',
    'Todos creen que la cantina es de la dueña. La verdad es que es de los que vuelven.',
    'Aprendí a cantar truco antes que a leer. Y miento mejor que cualquiera, salvo cuando me miran así.',
    'Una vez un viajero me ofreció la mitad de un viaje a Buenos Aires por una sonrisa. La sonrisa se la di; el viaje, no lo acepté.',
    'Se aprende más detrás de una barra que en cualquier escuela: quién miente, quién ama, quién debe y quién no lo dice.',
    'Hay clientes que vienen por la ginebra y otros por el ruido de la gente. Los segundos son los que más gastan, aunque no lo sepan.',
    'Al que le sirvo mal una vez, me lo cobra para siempre. Al que le sirvo bien, también, pero en otra moneda.',
  ],
  // un comentario de la peña (los sábados), de lo que ve desde la barra
  pena: ['Sábado de peña: la barra pierde y la pista gana. Hoy no me quejo.', 'Escuchá al Cholo: cuando afina así, es que hoy sale tango del bueno.', 'Dalia en la pista y yo en la barra: se reparten las miradas por igual.'],
  // cuando bailaste con Dalia (lo comenta al volver a su mesa)
  bailaste: ['Te vi en la pista con Dalia. Bailás mejor de lo que pedís, y eso que pedís bien.', 'No digas que no te avisé: con Dalia se baila y se queda mirando una hora.', 'Qué lindo se te veía en la pista. Para la próxima, fijate bien dónde apoyás los pies: se miran.'],
};

// ---------------------------------------------------------------- Dalia, la bailarina de la peña
export const BAILARINA = {
  // al llegar vos a la cantina un sábado de peña, desde la pista ({0}: tu apodo, o «forastero»)
  entrada: ['Ahí llegó {0}. Guardame un tango.', '¡{0}! Justo cuando la guitarra se pone buena.', 'Mirá quién viene a ver bailar. O a bailar, que es mejor.'],
  // mientras baila o descansa en la pista, desde lejos
  pista: ['Cuando la guitarra del Cholo empieza, yo ya estoy a mitad de camino.', 'El tango se baila con el cuerpo y se perdona con el alma.', '¿Mirando o bailando? Mirar es gratis; bailar, también, pero cuesta el orgullo.'],
  tango: ['Un tango se baila de a dos, aunque uno sea el espíritu del compás.', 'Si te da vergüenza, cerrá los ojos: el tango se siente en la espalda.'],
  chamame: ['El chamamé es de mi tierra: lo bailaba mi abuela con el delantal puesto y los zapatos en la mano.', 'En Entre Ríos el chamamé se baila con la sonrisa; el tango, con los ojos cerrados.'],
  descanso: ['Cinco minutos de descanso, que los tacos también tienen sentimientos.', 'Un traguito de agua y vuelvo. Los bailarines viven de aire, pero el aire también se acaba.'],
  // sabiendo lo que bailaste ({0}: lo que más bailaste con ella; {1}: lo otro)
  recuerda: ['Siempre {0} con vos. Hoy te propongo {1}, para que no se te enfríe la costumbre.', 'Ya bailamos mucho {0}. ¿Te animás a {1}? Prometo no pisarte.'],
  recuerdaNada: ['Todavía no bailamos juntos. No hay apuro: los buenos pasos se piensan con calma.'],
  // lo que dice de Lucrecia
  lucrecia: ['Lucre te atiende mejor que a nadie. De tanta sonrisa le van a doler las mejillas.', 'Si Lucrecia te dice que sí a algo, es que ya lo había decidido antes de que preguntaras.', 'La Lucre manda en la barra; yo, en la pista. Nos respetamos y nos pisamos los tacos.'],
  // cuando la ves de cerca sentada o en el descanso de la tarde (charlas del cuarto de atrás)
  tarde: ['Ensayo de tarde, cuando el salón está vacío y el piso me escucha mejor.', 'A la tarde me visto de entrecasa y bailo con la escoba. Es mi mejor pareja: nunca discute.'],
};

// ---------------------------------------------------------------- Ceinwen, la galesa de la casa de té
export const GALESA = {
  entrada: ['¡Prynhawn da, {0}! Pasá, pasá.', 'Croeso, {0}. Elegí mesa, que hoy no hay apuro.', 'Ya te vi venir, {0}. La pava está en el fuego.', 'Qué gusto, {0}. Hoy hay torta negra y scones calientes.'],
  entradaMañana: ['Buen día, {0}. Todavía estoy horneando, pero algo te sirvo.'],
  comentarios: {
    general: ['Si necesitás más agua caliente, levantá la mano.', 'Sin apuro, cariad: el té se toma con las manos tibias y la cabeza en otra parte.', 'En esta casa el reloj anda más despacio que en el resto del valle.'],
    tarde: ['La hora del té de verdad: desde las tres, la galería es la mejor mesa del valle.', 'A esta hora se sirve más té que en toda la mañana: es la costumbre galesa.'],
    lluvia: ['Escuchá la lluvia en el techo de chapa: mi abuela decía que es el mejor té con música.', 'Con lluvia, el té sabe distinto. Yo digo que mejor.'],
    nieve: ['Con la nieve afuera, el hogar de adentro se luce.'],
    viento: ['Con este viento, las tazas se sirven llenas hasta la mitad: no sea cosa que se vuelen.'],
    hogar: ['El hogar lo armamos con piedras del arroyo. Tira bien y se acuerda de los que se sentaron cerca.', 'Arrimate al fuego si querés: el sillón de la manta es de los que se disfrutan.'],
    gales: ['En Gales hay más ovejas que gente, y las ovejas también tienen opiniones.', 'Dicen que en Gales se toma primero la leche y después el té. Yo digo que cada uno elige su bando y se lleva la taza.', 'La palabra «cariad» no tiene traducción: quiere decir querido, pero con mejor sonido.'],
    torta: ['La torta negra se hace un mes antes de servirse. Los que no esperan, se pierden lo mejor.', 'El bara brith se remoja en té frío la noche anterior: paciencia dentro del pan.'],
    ultimo: ['Me acuerdo de que la última vez pediste {0}. Si querés lo repetimos, o probamos algo nuevo.'],
    confianza: ['Con vos la casa de té tiene otra luz, cariad. No sé qué hacés, pero seguí así.', 'Siempre te sirvo la taza más linda, ¿te diste cuenta?'],
  },
  sobremesa: ['¿Otra tacita, cariad? Mirá la carta cuando quieras.', 'Te veo cómodo. Eso me alegra más que la propina.'],
  reaccion: {
    'te-gales': 'Té galés: cargado y con paciencia. Dejalo reposar tres minutos, no más.',
    'te-hierbas': 'Té de hierbas del valle: manzanilla y menta que juntamos nosotras. Calma hasta al más nervioso.',
    'te-especiado': 'Té especiado: canela, clavo y jengibre. El que lo prueba entra en calor hasta las pestañas.',
    'te-miel': 'Té con miel de la sala. La miel se disuelve despacito: así se toma, también.',
    'te-helado': 'Té helado con limón: lo único frío que sirvo, y con cariño.',
    'cafe-leche': 'Café con leche, a la manera de la casa: más leche que café, pero con mucho carácter.',
    chocolate: 'Chocolate caliente, espeso. Un secreto: le pongo un poquito de canela y mucha paciencia.',
    mate: 'Mates en una casa de té: mi abuela se pondría de pie. Yo me siento y pruebo, que la casa es de todos.',
    'torta-negra': 'La torta negra está mejor al día siguiente: hoy te toca la de ayer, que es la mejor.',
    scones: 'Scones calientes con crema y dulce. Se parten con las manos, nunca con cuchillo.',
    'bara-brith': 'Bara brith: pan moteado de pasas. Con manteca por arriba, como lo comían en Gales.',
    'pan-jengibre': 'Pan de jengibre: los muñequitos son de la casa. Después no digas que no te advertí lo difícil que es morderles la cabeza.',
    'welsh-cakes': 'Welsh cakes: de la plancha al plato. Se comen calientes, burlándose del reloj.',
    'tarta-manzana': 'Tarta de manzana con la fruta del valle. La masa me sale quebrada; con las manos frías, sale mejor.',
    'te-completo': 'El té completo: tetera, taza y los tres platos. Hoy es tu día de suerte.',
  },
  delDia: ['Y la torta de hoy es la del día, con rebaja. Se la dejo a precio de amigo.'],
  charlas: [
    'Mi abuela decía que un buen té se mide por el silencio que sigue al primer sorbo.',
    'Los galeses llegaron al Chubut con las manos vacías y el himno en la boca. Aprendimos a hacer té con lo que había.',
    'En la casa de té se escuchan las mejores historias: las que nadie cuenta de frente.',
    'El hogar de piedra lo armamos entre todas, un domingo de lluvia. Se nota que lo hicieron con ganas.',
    'Bara brith significa «pan moteado». Los moteados somos todos, cariad: yo, de harina; vos, de camino.',
    'Aprendí a hornear antes que a escribir. La harina me enseñó paciencia; la paciencia, el idioma.',
  ],
};

const BANCOS = { moza: MOZA, galesa: GALESA };

// ---------------------------------------------------------------- lo que se elige
// Qué comenta `persona` ahora. `c`: { clima, hora, estacion, apodo, ultimo (nombre del último pedido), confianza (0 a 3), parroquianos: [nombres], pena, semilla }.
// `memoria` (un objeto que se guarda en la sesión): para no repetir la misma frase seguida. Devuelve null si no hay nada.
export function comentarioDe(persona, c = {}, memoria = {}) {
  const B = BANCOS[persona];
  if (!B) return null;
  const cat = [];
  const h = ((Number(c.hora) % 24) + 24) % 24;
  if (c.clima === 'lluvia') cat.push('lluvia', 'lluvia'); else if (c.clima === 'nieve') cat.push('nieve'); else if (c.clima === 'viento') cat.push('viento');
  if (persona === 'moza') {
    if (c.pena) cat.push('musica'); else cat.push(h >= 23 || h < 3 ? 'madrugada' : 'noche');
    cat.push('reloj', 'cuadros', 'cartel', 'musica', 'salamandra');
    if (c.parroquianos?.length) cat.push('parroquiano', 'parroquiano');
    if (c.confianza >= 1) cat.push('confianza');
    if (c.confianza >= 2) cat.push('picante');
  } else {
    cat.push('hogar', 'gales', 'torta');
    if (h >= 15) cat.push('tarde');
    if (c.confianza >= 2) cat.push('confianza');
  }
  if (c.ultimo) cat.push('ultimo');
  cat.push('general');
  const usables = cat.filter((k) => B.comentarios[k]);
  const k = eleg(usables, (c.semilla || 0) * 7 + (memoria.n || 0));
  const lista = B.comentarios[k];
  const prev = memoria.ultimas || [];
  // la que no se dijo hace poco (hasta cuatro intentos)
  let texto = '';
  for (let i = 0; i < 4; i++) {
    texto = eleg(lista, (c.semilla || 0) + (memoria.n || 0) * 3 + i);
    if (!prev.includes(texto)) break;
  }
  if (k === 'parroquiano') texto = llenar(texto, eleg(c.parroquianos, (c.semilla || 0) + (memoria.n || 0)));
  else if (k === 'ultimo') texto = llenar(texto, c.ultimo);
  else texto = llenar(texto, c.apodo || 'forastero');
  memoria.n = (memoria.n || 0) + 1;
  memoria.ultimas = [...prev, texto].slice(-5);
  return texto;
}
// Lo que dice al ver lo que pediste: la frase del plato (si la tiene) y, si es el del día, lo suyo
export function reaccionDeItem(persona, item, semilla = 0) {
  const B = BANCOS[persona];
  if (!B || !item) return null;
  const base = B.reaccion[item.id] || null;
  if (item.delDia) return [base, eleg(B.delDia, semilla)].filter(Boolean).join(' ');
  return base;
}
export const saludoDeEntrada = (persona, apodo, hora, semilla = 0) => {
  const B = BANCOS[persona];
  if (!B) return null;
  const h = ((Number(hora) % 24) + 24) % 24;
  const lista = persona === 'moza' ? (h < 20 ? B.entradaTarde : B.entrada) : (h < 12.5 ? B.entradaMañana : B.entrada);
  return llenar(eleg(lista, semilla), apodo || 'forastero');
};
// Lo último que pediste, dicho por quien te atiende ({0}: el nombre del plato; `veces`: cuántas veces lo pediste)
const ULTIMO = { moza: ['La última vez fue {0}, ¿no? ¿Repetimos o hoy te animás a otra cosa?', '¿Otra vez {0}, o esta noche venís con ganas de cambiar?', 'Me acuerdo de lo tuyo: {0}. Una moza buena nunca olvida un pedido… ni una mirada.'], favorito: ['Siempre {0}. Ya ni te pregunto: te lo hago de memoria.', '{0}, como siempre. En esta barra se aprende a los clientes.'] };
export const saludoUltimo = (nombre, veces = 0, semilla = 0) => llenar(eleg(veces >= 3 ? ULTIMO.favorito : ULTIMO.moza, semilla), nombre);
export const charlaDe = (persona, semilla = 0) => { const B = BANCOS[persona]; return B ? eleg(B.charlas, semilla) : null; };
export const sobremesaDe = (persona, semilla = 0) => { const B = BANCOS[persona]; return B ? eleg(B.sobremesa, semilla) : null; };
// Dalia: lo que comenta (según lo que pasa) y lo que dice sabiendo lo que bailaste ({tango, chamame}: cuántos de cada uno)
export function comentarioDalia(situacion, semilla = 0, extra = {}) {
  const lista = BAILARINA[situacion];
  if (!lista) return null;
  if (situacion === 'entrada') return llenar(eleg(lista, semilla), extra.apodo || 'forastero');
  return eleg(lista, semilla);
}
export function recuerdoDeDalia(bailes = {}, semilla = 0) {
  const t = Number(bailes.tango) || 0, c = Number(bailes.chamame) || 0;
  if (!t && !c) return eleg(BAILARINA.recuerdaNada, semilla);
  const [mas, otro] = t >= c ? ['el tango', 'un chamamé'] : ['el chamamé', 'un tango'];
  return llenar(eleg(BAILARINA.recuerda, semilla), mas, otro);
}
export const comentarioDeLucreSobreElBaile = (semilla = 0) => eleg(MOZA.bailaste, semilla);

// Todo lo nuevo que lee el jugador (para la prueba: nada religioso ni explícito, nada larguísimo)
export function textosVida() {
  const t = [];
  const rec = (x) => { if (typeof x === 'string') t.push(x); else if (Array.isArray(x)) x.forEach(rec); else if (x && typeof x === 'object') Object.values(x).forEach(rec); };
  rec(MOZA); rec(BAILARINA); rec(GALESA); rec(ULTIMO);
  return t;
}
