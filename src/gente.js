// Gente del bosque: personajes que cuentan historias de la Patagonia
import * as THREE from 'three';
import { limitarSombrasPorDistancia } from './rendimiento.js';
import { rng, lerp } from './ruido.js';
import { lam, palo, compactar } from './vida.js';
import { bola, tubo, torno, huso, deformar, pintar, colorear, franjas, matiz, mezcla, color, entintar, fundirNormales, puntasBufanda } from './formas.js';
import { LAGO } from './config.js';

// ---------------------------------------------------------------- historias
export const HISTORIAS = [
  // --- Ramón, el puestero
  { id: 'h-calafate', quien: 'ramon', titulo: 'El que come calafate, vuelve',
    partes: [
      'Ese arbusto espinoso de flores amarillas es calafate. En febrero se llena de frutos morados que tiñen los dedos.',
      'Dicen que una anciana de un pueblo del sur quedó sola cuando su gente se fue al norte por el invierno. Murió esperándolos, y en ese lugar creció un arbusto espinoso lleno de frutos dulces.',
      'Desde entonces se repite que el que come calafate siempre vuelve a la Patagonia. Fijate que hasta los que se van lejos terminan contando la misma historia.',
    ] },
  { id: 'h-pehuen', quien: 'ramon', titulo: 'El árbol que dio de comer',
    partes: [
      '¿Viste el pehuén del mirador? La araucaria. Esa especie ya estaba acá mucho antes que nosotros, y puede pasar los mil años.',
      'Los pewenche subían a la cordillera en marzo a juntar piñones. Los hervían, los tostaban y los guardaban enterrados para pasar el invierno. De ahí el nombre: gente del pehuén.',
      'Por eso se lo respeta. No es un árbol más: es el que le dio de comer a la gente de acá durante siglos.',
    ] },
  { id: 'h-nieve', quien: 'ramon', titulo: 'El invierno de la ceniza',
    partes: [
      'Yo llevo cuarenta inviernos en este puesto. El peor no fue el de más nieve, fue el de la ceniza.',
      'Reventó un volcán del otro lado de la cordillera y durante días cayó ceniza como si nevara en gris. Se tapó el pasto, el agua quedó turbia y los animales no sabían qué comer.',
      'Al año siguiente el bosque estaba más verde que nunca. Así es esto: lo que parece el final, muchas veces es abono.',
    ] },
  { id: 'h-ciervos', quien: 'ramon', titulo: 'Los que no eran de acá',
    partes: [
      'Los ciervos colorados que oís bramar en otoño no son de acá. Los trajeron de Europa en los años veinte para cazarlos, y se les fue de las manos.',
      'Comen los renovales de lenga y de coihue, o sea que se comen el bosque que viene. Y al huemul, que sí es de acá, lo empujan cada vez más arriba.',
      'No es culpa del animal, ojo. Es culpa del que lo trajo.',
    ] },

  { id: 'h-viento', quien: 'ramon', titulo: 'El viento que no para',
    partes: [
      'Acá el viento no es un día malo: es el clima. Sopla del oeste, baja de la cordillera seco y empuja todo para el este.',
      'Fijate los árboles del filo: crecen inclinados, con las ramas todas para un lado, como peinados. Se les dice árboles bandera.',
      'Cuando aprendés a leerlos sabés de dónde viene el viento sin sacar la mano del bolsillo.',
    ] },
  { id: 'h-cabalgata', quien: 'ramon', titulo: 'La veranada',
    partes: [
      'Antes subíamos los animales a la montaña en diciembre y los bajábamos en marzo. Veranada, le decimos: arriba hay pasto tierno cuando abajo ya está todo seco.',
      'Eran tres días de arreo. Se dormía donde te agarraba la noche, con el poncho y el fuego.',
      'Ahora quedamos pocos haciéndolo. Pero mientras haya pasto arriba, alguien va a seguir subiendo.',
    ] },
  // --- Ema, la guardaparque
  { id: 'h-chucao', quien: 'ema', titulo: 'El pájaro que avisa',
    partes: [
      'Ese canto fuerte que sale de la mata y nunca ves de dónde viene es el chucao. Un pajarito de pecho colorado que vive escondido abajo del todo.',
      'En la tradición mapuche su canto se escucha distinto según de qué lado te llegue: de un lado es buen anuncio para el camino, del otro conviene tener cuidado.',
      'Yo lo uso para otra cosa: si el chucao canta cerca, el bosque está tranquilo. Cuando se callan todos de golpe, algo pasó.',
    ] },
  { id: 'h-huemul', quien: 'ema', titulo: 'Contar los que quedan',
    partes: [
      'Mi trabajo más lento es contar huemules. Podés pasar semanas sin ver uno.',
      'Quedan muy pocos en toda la cordillera. Es Monumento Natural en Argentina y está en el escudo de Chile, y aun así casi nadie lo vio de cerca.',
      'Si alguna vez te cruzás con uno, quedate quieto y dejalo irse tranquilo. Con no correrlo ya estás ayudando.',
    ] },
  { id: 'h-llaollao', quien: 'ema', titulo: 'Lo que crece sobre el árbol',
    partes: [
      'Esas bolitas anaranjadas pegadas a las ramas son llao llao, un hongo que vive sobre las lengas y los coihues.',
      'Le hace nudos a la madera. Se come, y le dio el nombre a una península del Nahuel Huapi.',
      'Me gusta mostrarlo porque la gente llega buscando animales grandes y se termina yendo hablando de un hongo.',
    ] },
  { id: 'h-incendio', quien: 'ema', titulo: 'Una chispa',
    partes: [
      'Lo que más miedo me da del verano no es la tormenta: es una fogata mal apagada.',
      'Este bosque tarda siglos en crecer y arde en horas. Después, donde había coihues quedan cañas y arbustos por décadas.',
      'Por eso, fuego solo en los lugares habilitados, chico, y bien apagado con agua antes de irte. Nunca con tierra encima nada más: abajo sigue vivo.',
    ] },

  { id: 'h-semillas', quien: 'ema', titulo: 'El año de la caña',
    partes: [
      'La caña colihue florece toda junta, en toda una región, cada varias décadas. Después de florecer, muere.',
      'Esa lluvia de semillas llena el bosque de ratones. Y detrás de los ratones viene todo lo demás: zorros, lechuzas, chuncos.',
      'Al año siguiente el bosque queda raro, con claros donde había cañaverales. Ahí es cuando los renovales tienen su oportunidad.',
    ] },
  { id: 'h-liquenes', quien: 'ema', titulo: 'La barba del viejo',
    partes: [
      'Esos mechones grises colgando de las ramas son líquenes. No son parásitos: viven del aire y de la humedad.',
      'Son el mejor medidor de aire limpio que existe. Donde hay humo o contaminación, desaparecen primero.',
      'Cuando veas un bosque cargado de barba de viejo, respirá tranquilo: estás en un lugar sano.',
    ] },
  // --- Elsa, la guarda del tren
  { id: 'h-ramal', quien: 'guarda', titulo: 'El ramal que no cerró',
    partes: [
      'Este ramal se terminó en 1945, después de veintitantos años de obra. Trocha de setenta y cinco centímetros, la más angosta que vas a ver.',
      'Lo quisieron cerrar más de una vez. Cada tanto llegaba la orden y la gente de los pueblos salía a la vía a pararlo. Así siguió andando.',
      'Hoy anda menos por necesidad y más por cariño. Pero anda.',
    ] },
  { id: 'h-nieve-tren', quien: 'guarda', titulo: 'Cuando la nieve lo para',
    partes: [
      'En invierno la nieve tapa la vía y el tren se queda. A veces horas, a veces días.',
      'Se prende la salamandra de los coches, se hace agua caliente y se espera. Nadie se desespera: todos saben que en algún momento pasa la cuadrilla con las palas.',
      'Un maquinista me contó que la peor nevada la pasó jugando al truco con cuatro pasajeros que no conocía. Terminaron amigos.',
    ] },
  { id: 'h-empujar', quien: 'guarda', titulo: 'Bajarse a empujar',
    partes: [
      'En las cuestas largas la máquina patina y hay que tirar arena sobre el riel para que agarre.',
      'Si ni así, los pasajeros bajaban y caminaban al lado, y a veces empujaban. El tren iba tan despacio que después se subían en marcha, sin apuro.',
      'Ojo, no lo hagas vos. Pero la historia es cierta.',
    ] },
  { id: 'h-agua', quien: 'guarda', titulo: 'Parar a tomar agua',
    partes: [
      'La máquina toma agua cada tanto, por eso los tanques al lado de la vía.',
      'Mientras carga, el maquinista aceita las bielas y el fogonero acomoda el carbón. Son quince, veinte minutos.',
      'Esa parada no está en ningún horario, pero es la mejor: te bajás, estirás las piernas y escuchás el bosque con la máquina resoplando al lado.',
    ] },

  // --- Ercilia, del almacén
  { id: 'h-libreta', quien: 'ercilia', titulo: 'La libreta',
    partes: [
      'Antes acá nadie pagaba con billetes. Se anotaba en la libreta y se saldaba después de la esquila, cuando entraba la plata de la lana.',
      'Mi abuela le fiaba a todo el valle. Tenía una libreta por familia, con la letra chiquita, y no le fallaba casi nadie.',
      'Todavía la tengo guardada. La miro cada tanto: están todos los apellidos que quedan por acá.',
    ] },
  { id: 'h-arrieros', quien: 'ercilia', titulo: 'Los que traían todo',
    partes: [
      'Antes del tren, la mercadería venía en carros tirados por caballos. Veinte días desde la costa, con suerte.',
      'Se pedía en marzo lo que ibas a necesitar en agosto. Si te equivocabas en la cuenta, te aguantabas.',
      'Cuando llegó el ramal, lo primero que bajó fue un cajón de naranjas. La gente vino de tres leguas a mirarlas.',
    ] },

  // --- Nicanor, el pescador
  { id: 'h-truchas', quien: 'nicanor', titulo: 'Peces que vinieron en tren',
    partes: [
      'Las truchas que hay acá no son criollas. Las trajeron en huevos, en cajones con hielo, a principios del siglo pasado.',
      'Vinieron en barco, después en tren y al final a lomo de mula hasta los lagos. Muchas murieron en el camino; las que llegaron se hicieron dueñas del agua.',
      'La perca, esa sí es de acá. Cada vez cuesta más encontrarla grande, porque las truchas le comen la comida.',
    ] },
  { id: 'h-faro', quien: 'nicanor', titulo: 'La luz del otro lado',
    partes: [
      'Cuando el lago se pone bravo, se levanta como el mar. Ola corta y viento que te empuja para el medio.',
      'Una tarde me agarró lejos de la costa con el remo partido. Ya estaba oscuro cuando vi girar la luz del faro, y remé con lo que quedaba hasta ahí.',
      'Desde entonces salgo siempre temprano. Y cuando veo a alguien en kayak a la tardecita, le señalo el faro.',
    ] },
  { id: 'h-nahuelito', quien: 'nicanor', titulo: 'Lo que se ve en el agua',
    partes: [
      'Vas a escuchar la historia del bicho del lago. Que hay algo grande abajo, que asoma un lomo y desaparece.',
      'Yo pasé media vida arriba del agua. Vi troncos hundidos que suben cuando cambia la presión, vi cardúmenes que hacen una sombra enorme, vi olas que se cruzan y levantan un bulto.',
      'Nunca vi al bicho. Pero tampoco digo que no esté: el lago es hondo y guarda lo suyo.',
    ] },
  { id: 'h-devolver', quien: 'nicanor', titulo: 'Devolverla al agua',
    partes: [
      'Antes nos llevábamos todo lo que picaba. Hoy casi siempre devuelvo.',
      'Mojate las manos antes de tocarla, sacale el anzuelo rápido y metela en el agua sosteniéndola de frente a la corriente hasta que se vaya sola.',
      'Una trucha grande tardó años en hacerse grande. Volver a verla el año que viene vale más que comérmela hoy.',
    ] },
  { id: 'h-hielo', quien: 'nicanor', titulo: 'El lago que no se congela',
    partes: [
      'Mucha gente pregunta si el lago se congela en invierno. Los grandes, casi nunca: son demasiado hondos y el agua se mueve.',
      'Se congelan las lagunas chicas, los charcos, los bordes de las bahías. Ahí se ven las huellas del zorro cruzando derecho por arriba.',
      'Al lago grande el invierno lo pone negro y quieto, pero abajo sigue vivo. Las truchas bajan hondo y esperan.',
    ] },
  { id: 'h-bosque-hundido', quien: 'nicanor', titulo: 'El bosque de abajo',
    partes: [
      'Donde el agua está más clara se ven troncos parados en el fondo, todavía con ramas.',
      'Son árboles que quedaron bajo el agua cuando subió el nivel, hace mucho. El agua fría los conserva como si fuera ayer.',
      'Remar por encima de un bosque hundido es de las cosas más raras que hice. Uno mira para abajo y ve copas.',
    ] },
];

const PERSONAJES = {
  ramon: { nombre: 'Don Ramón', oficio: 'puestero', saludo: '¿Qué andás haciendo por acá arriba? Sentate un rato.', despedida: 'Cuando bajes, cerrá la tranquera. Y volvé cuando quieras.' },
  ema: { nombre: 'Ema', oficio: 'guardaparque', saludo: 'Buenas. Estoy haciendo el recorrido del sendero, ¿todo bien?', despedida: 'Seguí tranquilo. Si ves algo raro en el bosque, avisame.' },
  ercilia: { nombre: 'Ercilia', oficio: 'del almacén', saludo: 'Pasá, pasá. Si traés algo para cambiar, lo miramos.', despedida: 'Cuando junten más cosas se vuelven, que acá siempre hay.' },
  guarda: { nombre: 'Elsa', oficio: 'guarda del tren', saludo: 'Bienvenido a bordo. Acomodate donde quieras, que va a haber lugar.', despedida: 'Cualquier cosa me avisás. Y no te bajes en marcha.' },
  nicanor: { nombre: 'Nicanor', oficio: 'pescador', saludo: 'Justo estaba mirando el agua. ¿Sacaste algo hoy?', despedida: 'Que pique. Y ojo con el viento de la tarde.' },
};

// ---------------------------------------------------------------- modelo
// 3.4: la gente al estilo pintado de HushWood: figuras de adulto con volumen (torso, cadera
// y hombros de torno, brazos y piernas que se afinan, manos de mitón, cabeza con mentón,
// nariz, orejas y cejas), ropa de la cordillera y colores con degradé pintado en los
// vértices. Los pivotes son los de siempre (cadera 0.82, hombros 1.30, cabeza 1.46, codo
// 0.28 abajo del hombro): las animaciones y lo que llevan en la mano no cambian.
// Además de sus colores, cada uno tiene su ropa de todos los días:
const ROPA = {
  ramon: { piel: '#b98d66', bombacha: true, botas: 'altas', pantalon: '#6d6252' },
  nicanor: { piel: '#c0916a', botas: 'goma', campera: 'larga', abierta: true, pantalon: '#3d4652' },
  ema: { piel: '#cfa07a', bolsillos: true, trenza: true, botas: 'trekking', pantalon: '#5c5a44' },
  ercilia: { piel: '#d0a582', pollera: true, delantal: '#c9b48c', rodete: true, abierta: true },
  guarda: { piel: '#c99c76', botones: '#c9a64a', campera: 'larga', rodete: true, pantalon: '#262c3a' },
  'poblador-carpintero': { piel: '#c0906a', bombacha: true, chaleco: true, panuelo: '#9a3a2c', botas: 'altas', pantalon: '#7a6c58' },
  'poblador-panadera': { piel: '#c99a72', pollera: true, delantal: '#e4dccb', rodete: true },
  'poblador-herrero': { piel: '#a87a56', bombacha: true, delantal: '#3b2a1e', botas: 'altas', chaleco: true, pantalon: '#4c4640' },
  'poblador-pescador': { piel: '#b58a64', botas: 'goma', panuelo: '#c9b27a', abierta: true, pantalon: '#3e4650' },
  'poblador-maestra': { piel: '#d6ad8a', pollera: true, trenza: true, abierta: true },
  // 3.6: los seis pobladores nuevos de la aldea (ver aldea.js)
  'poblador-enfermera': { piel: '#d2a684', pollera: true, delantal: '#f0ece2', rodete: true, abierta: true },
  'poblador-telegrafista': { piel: '#c49a74', botones: '#b89a4a', chaleco: true, pantalon: '#2e2e36' },
  'poblador-tejedora': { piel: '#b88a62', pollera: true, trenza: true },
  'poblador-apicultor': { piel: '#d0a27c', bolsillos: true, botas: 'altas', pantalon: '#6a6048' },
  'poblador-guardaparque': { piel: '#c0916a', bolsillos: true, trenza: true, botas: 'trekking', pantalon: '#4c5236' },
  'poblador-musico': { piel: '#b5865e', chaleco: true, panuelo: '#c94a3a', pantalon: '#2a2420' },
  // 3.6: los vecinos de siempre de la aldea (los chicos, más bajitos: ver `talla` en aldea.js)
  'aldea-jefe': { piel: '#c0906a', botones: '#c9a64a', campera: 'larga', pantalon: '#2a3240' },
  'aldea-nelida': { piel: '#d0a27e', pollera: true, delantal: '#d9c7a8', rodete: true, abierta: true },
  'aldea-galesa': { piel: '#e0b898', pollera: true, delantal: '#f2ece0', rodete: true, botones: '#b8a070' },
  'aldea-abuela': { piel: '#c8a080', pollera: true, rodete: true },
  'aldea-padre': { piel: '#c49870', bombacha: true, chaleco: true, panuelo: '#8a3a2c', botas: 'altas', pantalon: '#5a5040' },
  'aldea-madre': { piel: '#b98a62', pollera: true, trenza: true, abierta: true },
  'aldea-nene': { piel: '#c99a72', botas: 'goma', pantalon: '#3a4250' },
  'aldea-nena': { piel: '#c49470', pollera: true, trenza: true, botas: 'goma' },
};
const ESC_TORSO = [1, 1, 0.74];
const R_PONCHO = new Set(['ramon']);   // 3.5: los que andan de poncho (ver la ladera en actualizar)
// 3.5.2: el brazo del mate. Antes el mate quedaba en el codo (el grupo de la mano estaba ahí desde
// que el brazo se hizo de una pieza) y se "tomaba" estirando el brazo. Ahora el brazo derecho de
// los que toman mate tiene el codo doblado (una sola pieza, como los demás) y la mano con el mate
// cuelgan de la muñeca, que se contra-gira para que el mate quede derecho; al tomar, el hombro
// sube el codo y lo gira hacia adentro y la bombilla llega a la boca (pose buscada con
// herramientas-34/v352-animales-scripts/pose-mate.mjs). Mismas llamadas de dibujo: el brazo
// (antes brazo y mano) y la muñeca (antes el mate suelto).
const CODO_MATE = -2.3;                                   // el codo, doblado fijo
const DIR_MATE = (() => { const c = Math.cos(CODO_MATE), s = Math.sin(CODO_MATE), v = new THREE.Vector3(-0.4, -c, -s); return v.normalize(); })();
const TOMAR_MATE = { x: -0.6, y: -0.48, inclina: -0.6 };  // hombro y mate en lo alto del sorbo
const _qMate = new THREE.Quaternion(), _qInclina = new THREE.Quaternion(), _eMate = new THREE.Euler();
// 3.6 (vida): lo que hacen en su tiempo libre (aldea-gente.js pone `pose`; la invitación a tomar
// algo, 'sentado'). Sólo giros y alturas de las piezas que ya hay, sin piezas ni programas
// nuevos: sentado (la cadera a la altura de una silla, el muslo derecho y la canilla al piso),
// leyendo (sentado, con el libro imaginario en las manos), paleando o partiendo leña (los brazos
// van y vienen), regando, mirando lejos y jugando (saltitos). Se llama después de los gestos de
// siempre, que ya pusieron todo en su lugar en este cuadro.
// 3.6.1: la altura del asiento (`g.asiento`, en metros sobre el piso: la pone aldea-gente.js con la
// silla de verdad) y la talla (los chicos, más bajitos) deciden cuánto baja la cadera. Antes bajaba
// siempre 37 cm de la figura: un chico (talla 0,6) quedaba 7 cm arriba de un almohadón de la biblioteca
// y hundido 18 cm en una silla. Si la cadera queda más baja que el largo de la canilla (un almohadón,
// el piso), las piernas van estiradas hacia adelante en vez de colgar.
const ASIENTO_COMUN = 0.47;                // una silla o un banco
const CADERA = 0.82, CANILLA = 0.44;       // en la figura: la cadera y de la rodilla a la suela
export function bajaSentado(asiento, talla) {
  const esc = talla > 0.3 ? talla : 1;
  const s = Number.isFinite(asiento) && asiento >= 0 ? asiento : ASIENTO_COMUN;
  return Math.max(0, Math.min(CADERA - 0.12, CADERA + 0.02 - s / esc));   // la cadera, 2 cm abajo del asiento
}
function posar(g, charlando) {
  const t = g.fase;
  switch (g.pose) {
    case 'sentado': case 'leyendo': {
      const b = bajaSentado(g.asiento, g.g?.scale?.y);
      const cadera = CADERA - b;
      const recoge = cadera < CANILLA ? Math.acos(Math.max(0, cadera - 0.02) / CANILLA) : 0;   // la canilla, adelante
      g.torso.position.y -= b; g.cabeza.position.y -= b;
      g.brazos[0].position.y -= b; g.brazos[1].position.y -= b;
      for (const p2 of g.patas) {
        p2.position.y -= b; p2.rotation.x = -1.45;
        if (p2.userData.rodilla) p2.userData.rodilla.rotation.x = 1.45 - recoge;
      }
      g.torso.rotation.x = -0.04;
      if (g.pose === 'leyendo') { g.brazos[0].rotation.x = -0.95; g.brazos[1].rotation.x = -0.95; g.cabeza.rotation.x += 0.3; }
      else if (!charlando && !g.mate) { g.brazos[0].rotation.x = -0.45; g.brazos[1].rotation.x = -0.45; }
      break;
    }
    case 'palear': case 'hachar': {
      const k = Math.sin(t * (g.pose === 'hachar' ? 3.2 : 2.2));
      g.brazos[0].rotation.x = -0.9 + k * 0.5; g.brazos[1].rotation.x = -0.9 + k * 0.5;
      g.torso.rotation.x = 0.22 + k * 0.08; g.cabeza.rotation.x += 0.12;
      break;
    }
    case 'regar':
      g.brazos[1].rotation.x = -0.85 + Math.sin(t * 1.3) * 0.08; g.brazos[0].rotation.x = -0.15;
      g.torso.rotation.x = 0.1; g.cabeza.rotation.x += 0.2;
      break;
    case 'mirar':
      g.cabeza.rotation.x -= 0.12; g.brazos[0].rotation.x = 0.12; g.brazos[1].rotation.x = 0.12;
      break;
    case 'jugar': {
      const k = Math.abs(Math.sin(t * 5));
      g.torso.position.y += k * 0.05; g.cabeza.position.y += k * 0.05;
      g.brazos[0].rotation.x = -0.6 - k * 0.8; g.brazos[1].rotation.x = -0.6 - k * 0.8;
      break;
    }
    // 3.6 (mecánicas): el baile del sábado (un balanceo de cadera y un pasito), el músico que
    // rasguea, el jefe que tira de la soga y el gesto de cada oficio
    case 'bailar': {
      const k = Math.sin(t * 3.4), s = Math.abs(Math.sin(t * 3.4));
      g.torso.rotation.z = k * 0.09; g.torso.position.y += s * 0.035; g.cabeza.position.y += s * 0.035;
      g.cabeza.rotation.z = -k * 0.05;
      g.brazos[0].rotation.x = -0.5 + k * 0.25; g.brazos[1].rotation.x = -0.5 - k * 0.25;
      g.brazos[0].rotation.z = -0.25; g.brazos[1].rotation.z = 0.25;
      break;
    }
    case 'tocar':
      g.brazos[0].rotation.x = -1.0; g.brazos[0].rotation.z = 0.35;
      g.brazos[1].rotation.x = -0.6 + Math.sin(t * 9) * 0.18; g.cabeza.rotation.x += 0.15;
      break;
    case 'izar': {
      const k = Math.sin(t * 2.6);
      g.brazos[0].rotation.x = -2.1 + k * 0.45; g.brazos[1].rotation.x = -2.1 - k * 0.45;
      g.cabeza.rotation.x -= 0.25;
      break;
    }
    case 'martillar': {
      const k = Math.max(0, Math.sin(t * 4.2));
      g.brazos[1].rotation.x = -0.6 - k * 1.3; g.brazos[0].rotation.x = -0.7;
      g.torso.rotation.x = 0.12; g.cabeza.rotation.x += 0.25;
      break;
    }
    case 'amasar': {
      const k = Math.sin(t * 3);
      g.brazos[0].rotation.x = -0.9 + k * 0.2; g.brazos[1].rotation.x = -0.9 - k * 0.2;
      g.torso.rotation.x = 0.18 + Math.abs(k) * 0.06; g.cabeza.rotation.x += 0.3;
      break;
    }
    case 'serruchar': {
      const k = Math.sin(t * 5);
      g.brazos[1].rotation.x = -0.8 + k * 0.35; g.brazos[0].rotation.x = -0.4;
      g.torso.rotation.x = 0.15 + k * 0.03; g.cabeza.rotation.x += 0.25;
      break;
    }
    default: break;
  }
}
// Suma la geometría de `fuente` (ya fundida, con su posición respecto de `destino`) a la de
// `destino`: devuelve la geometría junta (las dos son indexadas, con posición, normal y color).
function juntarGeometrias(destino, fuente, matriz) {
  const a = destino.geometry, b = fuente.geometry.clone().applyMatrix4(matriz);
  const na = a.attributes.position.count, nb = b.attributes.position.count;
  const geo = new THREE.BufferGeometry();
  for (const k of ['position', 'normal', 'color']) {
    const arr = new Float32Array((na + nb) * 3);
    arr.set(a.attributes[k].array, 0); arr.set(b.attributes[k].array, na * 3);
    geo.setAttribute(k, new THREE.BufferAttribute(arr, 3));
  }
  const ia = a.index.array, ib = b.index.array;
  const idx = (na + nb) > 65535 ? new Uint32Array(ia.length + ib.length) : new Uint16Array(ia.length + ib.length);
  idx.set(ia, 0); for (let i = 0; i < ib.length; i++) idx[ia.length + i] = ib[i] + na;
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  geo.computeBoundingSphere();
  b.dispose();
  return geo;
}
function mallaPersona(colores, clave = '', conMate = false) {
  const R = ROPA[clave] || {};
  const g = new THREE.Group();
  const piel = colores.piel || R.piel || '#c49a70';
  const ropa = colores.ropa, abrigo = colores.abrigo;
  const pantalon = colores.pantalon || R.pantalon || '#3f3a33';
  const pelo = colores.pelo || '#3a2a1e';
  const bota = R.botas === 'goma' ? '#2a2d2c' : R.botas === 'trekking' ? '#5a4632' : '#3b2f26';
  const manga = R.chaleco ? ropa : abrigo;
  // ---- piernas: un torno de la cadera al tobillo y la bota (de caña alta para el campo)
  const altas = R.botas === 'altas' || R.botas === 'goma';
  // 3.5: la pierna en dos: el muslo cuelga de la cadera y la pierna con la bota, de la rodilla
  // (37 cm más abajo), que dobla al caminar. Cada parte cierra en cúpula para que la rodilla
  // doblada no muestre el hueco. (La rodilla ocupa la llamada de dibujo que antes usaba el
  // antebrazo, que ahora va fundido con el brazo: la figura dibuja lo mismo.)
  const RODILLA = 0.37;
  const perfilMuslo = R.bombacha
    ? [[0.0, -0.49], [0.06, -0.475], [0.086, -0.44], [0.1, -0.3], [0.1, -0.17], [0.092, -0.04], [0.074, 0.06]]
    : [[0.0, -0.47], [0.05, -0.457], [0.064, -0.43], [0.069, -0.39], [0.077, -0.28], [0.086, -0.12], [0.087, 0.0], [0.072, 0.06]];
  const perfilCanilla = (R.bombacha
    ? [[0.05, -0.7], [0.056, -0.6], [0.066, -0.5], [0.082, -0.43], [0.084, -0.38], [0.064, -0.335], [0.0, -0.32]]
    : [[0.05, -0.7], [0.055, -0.62], [0.059, -0.52], [0.064, -0.44], [0.063, -0.37], [0.046, -0.335], [0.0, -0.325]]).map(([r, y]) => [r, y + RODILLA]);
  const perfilBota = (altas
    ? [[0.053, -0.8], [0.06, -0.72], [0.066, -0.6], [0.07, -0.5], [0.075, -0.44], [0.07, -0.435]]
    : [[0.053, -0.8], [0.058, -0.74], [0.062, -0.66], [0.066, -0.62], [0.062, -0.615]]).map(([r, y]) => [r, y + RODILLA]);
  const patas = [];
  for (const l of [-1, 1]) {
    const piv = new THREE.Group(); piv.position.set(l * 0.115, 0.82, 0);
    piv.add(torno(pantalon, perfilMuslo, null, null, [1, 1, 0.92], 11));
    const rodilla = new THREE.Group(); rodilla.position.set(0, -RODILLA, 0);
    rodilla.add(torno(pantalon, perfilCanilla, null, null, [1, 1, 0.92], 11));
    rodilla.add(torno(bota, perfilBota, null, null, null, 11));
    rodilla.add(bola(bota, [0.06, 0.05, 0.125], [0, -0.78 + RODILLA, 0.048]));                    // empeine
    rodilla.add(bola(matiz(bota, 0.55), [0.063, 0.018, 0.128], [0, -0.812 + RODILLA, 0.043]));    // suela
    piv.add(rodilla); piv.userData.rodilla = rodilla;
    g.add(piv); patas.push(piv);
  }
  // ---- torso: cadera, la campera (o el chaleco) sobre la camisa, y lo de cada uno. Todas las
  // capas pasan por la misma forma (pecho adelante, espalda plana, hombros anchos y finos de
  // adelante a atrás), así quedan una adentro de la otra.
  const torso = new THREE.Group(); torso.position.set(0, 0.82, 0);
  const capa = (c, perfil, lados = 16, desde = 0, arco = Math.PI * 2, zBase = 0.74, ondas = 0) => deformar(torno(c, perfil, null, null, null, lados, desde, arco), (v) => {
    const pecho = Math.max(0, 1 - Math.abs(v.y - 0.33) / 0.15), hombro = Math.max(0, 1 - Math.abs(v.y - 0.45) / 0.08);
    // pliegues que se abren hacia el ruedo (la pollera, el faldón de la campera larga)
    if (ondas) { const k = 1 + ondas * Math.sin(Math.atan2(v.x, v.z) * 8 + 0.3) * Math.min(1, Math.max(0, -v.y / 0.4)); v.x *= k; v.z *= k; }
    v.z *= zBase * (v.z > 0 ? 1 + 0.08 * pecho : 0.96) * (v.y > 0.44 ? 0.88 : 1);
    v.x *= 1 + 0.1 * hombro;   // 3.5.2: el hombro un poco más ancho, tapa el arranque del brazo
  });
  torso.add(bola(pantalon, [0.15, 0.12, 0.104], [0, 0.02, 0]));
  const cuerpoAlto = [[0.16, 0.02], [0.149, 0.12], [0.164, 0.24], [0.19, 0.35], [0.205, 0.43], [0.204, 0.47], [0.178, 0.515], [0.128, 0.548], [0.07, 0.567]];
  const faldon = R.campera === 'larga' ? [[0.184, -0.22], [0.172, -0.1]] : [[0.163, -0.07]];
  let capaHombro = null;   // 3.5.2: la tela que cubre el hombro (para la costura con el brazo)
  if (R.chaleco || R.abierta) {
    // la camisa (o el pulóver) que se ve por adelante
    capaHombro = capa(ropa, [[0.15, -0.02], ...cuerpoAlto.map(([r, y]) => [r - 0.007, y])], 14);
    torso.add(capaHombro);
  }
  if (R.chaleco) {
    torso.add(capa(abrigo, [[0.167, -0.06], [0.166, 0.02], [0.156, 0.12], [0.171, 0.24], [0.197, 0.35], [0.211, 0.43], [0.2, 0.478]], 14, 0.42, Math.PI * 2 - 0.84));
    if (R.bombacha) {
      // 3.5: con bombacha, la faja de los paisanos: ancha y de lana colorada, apenas más angosta
      // que el delantal (así no lo atraviesa) y sobre el borde del chaleco
      torso.add(capa('#7a2e26', [[0.163, -0.05], [0.169, -0.038], [0.17, 0.028], [0.165, 0.042]], 16));
    } else torso.add(capa('#4a3626', [[0.168, -0.035], [0.168, 0.02]], 14));   // el cinto
  } else {
    capaHombro = capa(abrigo, [...faldon, ...cuerpoAlto], R.campera === 'larga' ? 24 : 16, R.abierta ? 0.3 : 0, R.abierta ? Math.PI * 2 - 0.6 : Math.PI * 2, 0.74, R.campera === 'larga' ? 0.03 : 0);
    torso.add(capaHombro);
    torso.add(capa(matiz(abrigo, 0.88), [[0.084, 0.535], [0.086, 0.572], [0.075, 0.586]], 14, 0, Math.PI * 2, 0.95));   // el cuello
  }
  if (R.pollera) {
    torso.add(capa(mezcla(ropa, '#2a2420', 0.35), [[0.25, -0.5], [0.236, -0.42], [0.206, -0.24], [0.181, -0.08], [0.167, 0.02], [0.16, 0.07]], 32, 0, Math.PI * 2, 0.8, 0.045));
  }
  if (R.delantal) {
    const perfil = R.pollera
      ? [[0.255, -0.38], [0.235, -0.28], [0.205, -0.14], [0.186, -0.04], [0.175, 0.04], [0.168, 0.12], [0.176, 0.24], [0.198, 0.36]]
      : [[0.196, -0.4], [0.186, -0.2], [0.174, -0.04], [0.17, 0.04], [0.166, 0.12], [0.176, 0.24], [0.198, 0.36]];
    torso.add(capa(R.delantal, perfil, 10, -0.68, 1.36, R.pollera ? 0.8 : 0.74));
  }
  if (R.bolsillos) for (const l of [-1, 1]) {
    // 3.5.2: los bolsillos del pecho, cosidos sobre la tela y siguiendo la curva del pecho
    // (antes eran cajas que de costado se veían salidas del cuerpo)
    torso.add(bola(matiz(abrigo, 0.88), [0.036, 0.034, 0.004], [l * 0.08, 0.325, 0.134], [-0.1, l * 0.36, 0]));
    torso.add(bola(matiz(abrigo, 0.74), [0.039, 0.011, 0.006], [l * 0.081, 0.362, 0.134], [-0.1, l * 0.36, 0]));   // la tapa
  }
  if (R.botones) for (const l of [-1, 1]) for (const y of [0.16, 0.27, 0.38]) torso.add(bola(R.botones, [0.011, 0.011, 0.008], [l * 0.05, y, 0.122 + (y > 0.3 ? 0.014 : y > 0.2 ? 0.005 : 0)]));
  if (colores.poncho) {
    // el poncho cae de los hombros y tapa los brazos, con las puntas adelante y atrás más
    // bajas que los costados, y la guarda clara y oscura cerca del borde; abajo, los flecos
    const claroP = mezcla(abrigo, '#e3d6b8', 0.7), oscuroP = matiz(abrigo, 0.55), listaP = matiz(abrigo, 0.78);
    // los pliegues: la tela ondula más cuanto más abajo, siete pliegues alrededor
    const caida = (v) => {
      const r = Math.hypot(v.x, v.z), cz = r > 1e-4 ? v.z / r : 0, fi = Math.atan2(v.x, v.z);
      const pliegue = 1 + 0.04 * Math.sin(fi * 7 + 0.4) * Math.min(1, Math.max(0, (0.36 - v.y) / 0.45));
      v.x *= pliegue; v.z *= pliegue;
      if (v.y < 0.12) v.y -= 0.075 * cz * cz * Math.min(1, (0.12 - v.y) / 0.25);
      v.z *= 0.64;
    };
    const perfilP = [[0.35, -0.18], [0.348, -0.15], [0.347, -0.146], [0.345, -0.12], [0.344, -0.116], [0.342, -0.09], [0.341, -0.086],
      [0.335, 0.05], [0.325, 0.2], [0.31, 0.33], [0.29, 0.43], [0.255, 0.49], [0.2, 0.53], [0.14, 0.565], [0.095, 0.59], [0.078, 0.605]];
    const p = torno(abrigo, perfilP, null, null, null, 28);
    colorear(p, (c, v, i) => {
      if (v.y >= -0.1465 && v.y <= -0.1195) c.set(claroP);
      else if (v.y >= -0.1165 && v.y <= -0.0895) c.set(oscuroP);
      else if (Math.floor(i / perfilP.length) % 7 === 3) c.set(listaP);   // las listas del tejido, en cada pliegue
    });
    torso.add(deformar(p, caida));
    const flecos = torno(abrigo, [[0.352, -0.215], [0.35, -0.178]], null, null, null, 56);
    colorear(flecos, (c, v, i) => { c.multiplyScalar(Math.floor(i / 2) % 2 ? 0.6 : 1.08); });
    torso.add(deformar(flecos, caida));
    torso.add(torno(matiz(abrigo, 0.8), [[0.086, 0.585], [0.082, 0.612], [0.07, 0.62]], null, null, null, 14));
  }
  const cuello = colores.bufanda || R.panuelo;
  if (cuello && !colores.poncho) {
    const vuelta = new THREE.Mesh(new THREE.TorusGeometry(0.076, R.panuelo ? 0.017 : 0.029, 8, 20), color(cuello));
    vuelta.position.set(0, 0.555, 0.01); vuelta.rotation.set(Math.PI / 2 - 0.16, 0, 0); vuelta.scale.set(1, 0.9, 1);
    torso.add(vuelta);
    // 3.5: antes el nudo y la punta eran un disco chato pegado al pecho (se veía como un plato).
    // Ahora el pañuelo tiene su nudito y las dos puntas en triángulo, y la bufanda cae en una
    // tira que sigue el pecho y se afina abajo.
    if (R.panuelo) {
      torso.add(bola(cuello, [0.022, 0.018, 0.016], [0, 0.522, 0.122]));                                         // el nudo
      for (const l of [-1, 1]) {
        const punta = deformar(new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.075, 3, 1), color(matiz(cuello, 0.92))), (v) => { v.z *= 0.3; });
        punta.position.set(l * 0.012, 0.485, 0.128); punta.rotation.set(Math.PI - 0.32, 0, -l * 0.28); torso.add(punta);
      }
    } else {
      // 3.5.2: la bufanda de lana: dos vueltas gruesas al cuello y las dos puntas que caen
      // adelante, corridas al costado, anchas, con las rayas del tejido y el fleco (antes era
      // una sola tira al medio del pecho y se leía como corbata)
      const vuelta2 = new THREE.Mesh(new THREE.TorusGeometry(0.073, 0.025, 8, 20), color(matiz(cuello, 0.93)));
      vuelta2.position.set(0, 0.527, 0.014); vuelta2.rotation.set(Math.PI / 2 - 0.1, 0.12, 0);
      torso.add(vuelta2);
      for (const p of puntasBufanda(cuello, { x: -0.098, y: 0.52, pecho: 0.156, largo: 0.17 })) torso.add(p);
    }
  }
  // ---- brazos: hombro, codo y mano de mitón (la mano derecha lleva el mate, la caña...).
  // Las piezas se corren un poco hacia el cuerpo para que hombro y torso sean una sola masa.
  // 3.5: cada brazo es una sola forma suave: del hombro (que nace adentro del torso, sin bola
  // pegada) al codo, con el bíceps, y del codo a la muñeca, apenas doblado hacia adelante; el
  // puño de la manga y una mano con palma, dedos juntos que se curvan y el pulgar. Todo se funde
  // con el brazo (una malla por brazo); el grupo `ante` queda vacío en el codo, para lo que
  // llevan en la mano. Con poncho, el brazo va debajo: se ve sólo desde el antebrazo.
  const brazos = [];
  let muneca = null;
  for (const l of [-1, 1]) {
    const piv = new THREE.Group(); piv.position.set(l * 0.225, 1.3, 0);
    const x = -l * 0.016;
    if (conMate && l === 1) {
      // 3.5.2: el brazo del mate: del hombro (o del codo, debajo del poncho) a la muñeca, con el
      // codo doblado; la mano agarra la calabaza en la muñeca (ver CODO_MATE)
      const codo = [x + l * 0.012, -0.28, 0.0], D = DIR_MATE;
      const en = (t) => [codo[0] + D.x * t, codo[1] + D.y * t, codo[2] + D.z * t];
      const W = en(0.25);
      const brazo = colores.poncho
        ? [[[codo[0], -0.24, 0.0], codo, en(0.06), en(0.15), W], [0.044, 0.047, 0.046, 0.044, 0.04]]
        : [[[x - l * 0.04, -0.014, 0], [x - l * 0.014, -0.042, 0], [x + l * 0.006, -0.13, 0.0], [codo[0], -0.235, 0.0], codo, en(0.05), en(0.14), W],
          [0.04, 0.052, 0.051, 0.047, 0.046, 0.045, 0.043, 0.04]];
      piv.add(huso(manga, brazo[0], brazo[1], colores.poncho ? 12 : 22, 12));
      const puno = torno(matiz(manga, 0.82), [[0.041, -0.022], [0.045, -0.004], [0.044, 0.018], [0.039, 0.022]], W, null, null, 12);
      puno.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), D);
      piv.add(puno);
      // la muñeca: la mano (la palma de costado contra la calabaza, los dedos que la rodean por
      // adelante y el pulgar por atrás) y el mate, armados derechos como con el brazo quieto
      muneca = new THREE.Group(); muneca.position.set(W[0], W[1], W[2]);
      const MC = [-0.045, 0.035, 0.03], en2 = (a, b, c) => [MC[0] + a, MC[1] + b, MC[2] + c];
      // (la mano va primero: al fundir, sus triángulos quedan adelante y el mate se puede guardar
      // dibujando sólo esa parte; ver `mateVisible`)
      const mano = [
        bola(piel, [0.022, 0.044, 0.034], [0.01, 0.022, 0.018], [0.35, 0, -0.25]),     // la palma
        bola(piel, [0.022, 0.03, 0.05], en2(0.022, -0.012, 0.04), [0, -0.75, 0]),        // los dedos, por adelante
        bola(piel, [0.012, 0.03, 0.014], en2(0.02, 0.012, -0.045), [0.3, 0, 0.5]),       // el pulgar, por atrás
      ];
      for (const m of mano) muneca.add(m);
      muneca.userData.indicesMano = mano.reduce((s, m) => s + m.geometry.index.count, 0);
      // el mate: la calabaza con su virola, la yerba y la bombilla
      muneca.add(torno('#6b4a2c', [[0.0, -0.055], [0.04, -0.05], [0.058, -0.015], [0.056, 0.025], [0.045, 0.05], [0.042, 0.058]], MC, null, null, 14));
      muneca.add(torno('#b8b2a4', [[0.042, 0.056], [0.045, 0.06], [0.045, 0.072], [0.041, 0.074]], MC, null, null, 14));   // la virola
      muneca.add(bola('#3b4a2a', [0.04, 0.008, 0.04], en2(0, 0.064, 0)));                                                 // la yerba
      muneca.add(tubo('#b9b2a0', 0.006, 0.006, 0.16, en2(0.02, 0.11, 0.01), [0.25, 0, 0.2], 6, true));
      piv.add(muneca);
      piv.userData.muneca = muneca;
    } else {
      // del hombro a la muñeca en una sola pieza (sin costura en el codo), con el codo apenas
      // doblado hacia adelante; con poncho, desde el codo
      const muneca = [x + l * 0.02, -0.5, 0.03];
      const brazo = colores.poncho
        ? [[[x + l * 0.012, -0.26, 0.002], [x + l * 0.015, -0.32, 0.01], [x + l * 0.018, -0.42, 0.02], muneca], [0.044, 0.046, 0.043, 0.04]]
        // (3.5.2: el arranque del brazo, 2 cm más abajo: asomaba arriba del hombro como hombrera)
        : [[[x - l * 0.04, -0.014, 0], [x - l * 0.014, -0.042, 0], [x + l * 0.006, -0.13, 0.0], [x + l * 0.012, -0.27, 0.002], [x + l * 0.016, -0.38, 0.016], muneca],
          [0.04, 0.052, 0.051, 0.046, 0.044, 0.04]];
      piv.add(huso(manga, brazo[0], brazo[1], colores.poncho ? 10 : 18, 12));
      piv.add(torno(matiz(manga, 0.82), [[0.041, -0.022], [0.045, -0.004], [0.044, 0.018], [0.039, 0.022]], [muneca[0], muneca[1] - 0.004, muneca[2]], [-0.1, 0, 0], null, 12));   // el puño
      piv.add(bola(piel, [0.032, 0.042, 0.024], [muneca[0], -0.545, 0.034], [-0.1, 0, 0]));                       // la palma
      piv.add(bola(piel, [0.029, 0.034, 0.021], [muneca[0] + l * 0.002, -0.585, 0.044], [-0.32, 0, 0]));          // los dedos juntos, curvados
      piv.add(bola(piel, [0.011, 0.024, 0.012], [muneca[0] - l * 0.026, -0.548, 0.05], [-0.25, 0, l * 0.5]));      // el pulgar
    }
    const ante = new THREE.Group(); ante.position.set(0, -0.28, 0);
    piv.add(ante);
    piv.userData.ante = ante;
    g.add(piv); brazos.push(piv);
  }
  // 3.5.2: la costura del hombro. El brazo nace adentro del torso y donde asoma quedaba una
  // raya de luz (las dos superficies con normales distintas): las normales del brazo cerca del
  // torso se inclinan hacia las del torso y al revés, y la luz pasa de uno al otro sin raya.
  if (!colores.poncho && capaHombro) {
    for (const b of brazos) {
      const malla = b.children.find((o) => o.isMesh && o.geometry.type === 'TubeGeometry');
      if (malla) fundirNormales(malla, [b.position.x, b.position.y, 0], capaHombro, [0, 0.82, 0], 0.05, (px, py) => py > 1.16);
    }
  }
  g.add(torso);
  // ---- cabeza
  const cabeza = new THREE.Group(); cabeza.position.set(0, 1.46, 0);
  cabeza.add(tubo(piel, 0.046, 0.054, 0.17, [0, -0.072, 0.004]));
  const rubor = mezcla(piel, '#c4554a', 0.5), sombraPiel = mezcla(matiz(piel, 0.62), '#5a3a3a', 0.25);
  cabeza.add(pintar(deformar(bola(piel, [0.097, 0.118, 0.107], [0, 0.05, 0.004], null, [18, 14]), (v) => {
    if (v.y < 0) { const t = -v.y; v.x *= 1 - 0.22 * t * t; v.z += 0.08 * t * Math.max(0, v.z); }   // mandíbula y mentón
    if (v.z < 0) v.z *= 1.05;                                                                         // la nuca
    if (v.z > 0.6) v.z = 0.6 + (v.z - 0.6) * 0.6;                                                     // la cara, más plana
  }), (c, p, n) => {
    const t = Math.max(0, 1 - Math.abs(Math.abs(n.x) - 0.45) * 4) * Math.max(0, n.z) * Math.max(0, 1 - Math.abs(p.y - 1.49) * 22); entintar(c, rubor, t * 0.5);
    // 3.5: la cuenca de los ojos y la sombrita bajo la nariz, pintadas: la cara toma volumen
    const fz = Math.max(0, n.z);
    const cuenca = Math.exp(-(((Math.abs(p.x) - 0.034) / 0.024) ** 2 + ((p.y - 1.527) / 0.016) ** 2));
    const bajoNariz = Math.exp(-((p.x / 0.016) ** 2 + ((p.y - 1.474) / 0.008) ** 2));
    entintar(c, sombraPiel, (cuenca * 0.28 + bajoNariz * 0.3) * fz);
  }));
  // la nariz: más corta y redonda (antes asomaba como una clavija), con las aletas
  cabeza.add(deformar(bola(matiz(piel, 0.98), [0.0155, 0.025, 0.016], [0, 0.034, 0.094], [-0.22, 0, 0]), (v) => { if (v.y > 0) v.z *= 1 - 0.4 * v.y; }));
  for (const l of [-1, 1]) cabeza.add(bola(matiz(piel, 0.95), [0.0095, 0.0085, 0.0085], [l * 0.0125, 0.018, 0.09]));
  for (const l of [-1, 1]) {
    // 3.5: el ojo con su blanco, la pupila y el párpado de arriba (la mirada se entiende)
    cabeza.add(bola('#e6ddcf', [0.0145, 0.0098, 0.004], [l * 0.034, 0.06, 0.0905]));                    // el blanco
    cabeza.add(bola('#21170f', [0.0088, 0.0098, 0.0042], [l * 0.0335, 0.0598, 0.0926]));                  // la pupila
    cabeza.add(bola(matiz(piel, 0.66), [0.0162, 0.003, 0.0046], [l * 0.034, 0.0705, 0.0916], [0, 0, -l * 0.08]));   // el párpado
    cabeza.add(bola(matiz(pelo, 0.85), [0.026, 0.0072, 0.0065], [l * 0.035, 0.084, 0.0945], [0, 0, -l * 0.15]));   // las cejas
    cabeza.add(bola(piel, [0.015, 0.028, 0.013], [l * 0.096, 0.042, -0.004]));                          // las orejas
  }
  if (!colores.barba) cabeza.add(bola(mezcla(matiz(piel, 0.72), '#8c3b35', 0.35), [0.021, 0.0052, 0.006], [0, -0.004, 0.0915]));  // la boca
  // el pelo: un casco que no tapa la cara y baja hasta la nuca
  cabeza.add(deformar(bola(pelo, [0.103, 0.118, 0.112], [0, 0.067, -0.012], null, [16, 11]), (v) => {
    if (v.z > 0.15 && v.y < 0.4) v.z -= (v.z - 0.15) * 0.85 * Math.min(1, (0.4 - v.y) * 2.2);
    if (v.z < -0.1 && v.y < 0) v.y *= 1.3;
  }));
  if (R.rodete) cabeza.add(bola(pelo, [0.048, 0.044, 0.042], [0, 0.03, -0.112]));
  if (R.trenza) for (let i = 0; i < 4; i++) cabeza.add(bola(pelo, [0.026 - i * 0.002, 0.034, 0.024], [0, 0.0 - i * 0.055, -0.108 - i * 0.008]));
  if (colores.barba) {
    cabeza.add(deformar(bola(colores.barba, [0.094, 0.082, 0.09], [0, -0.022, 0.022], null, [14, 10]), (v) => {
      if (v.z < 0) { v.z *= 0.45; v.x *= 0.9; }
      if (v.y > 0.3 && v.z > 0.5) v.y -= (v.y - 0.3) * 0.6;
    }));
    cabeza.add(bola(colores.barba, [0.043, 0.014, 0.02], [0, 0.012, 0.103], [0.1, 0, 0]));            // el bigote
  }
  if (colores.gorro === 'boina') {
    cabeza.add(torno(abrigo, [[0.099, 0.0], [0.118, 0.012], [0.133, 0.03], [0.129, 0.05], [0.1, 0.068], [0.05, 0.078], [0.0, 0.08]], [0.006, 0.122, -0.008], [-0.12, 0, -0.14], null, 18));
    cabeza.add(bola(abrigo, [0.011, 0.018, 0.011], [0.016, 0.205, -0.016]));
  } else if (colores.gorro === 'sombrero') {
    const fieltro = '#5f4730', cinta = '#3a2d21', base = 1.46 + 0.126;
    cabeza.add(pintar(deformar(torno(fieltro, [[0.104, 0.0], [0.105, 0.026], [0.106, 0.03], [0.107, 0.06], [0.1, 0.098], [0.08, 0.114], [0.0, 0.12]], [0, 0.126, -0.004], null, [1, 1, 0.94], 16),
      (v) => { if (v.y > 0.09) v.y -= 0.022 * Math.max(0, 1 - Math.abs(v.x) / 0.06); }), franjas([[base - 0.002, base + 0.027, cinta]])));
    // el ala: arriba y abajo, con los costados apenas levantados
    for (const s of [1, -1]) {
      const ala = new THREE.Mesh(new THREE.RingGeometry(0.098, 0.245, 26, 3), color(s > 0 ? fieltro : matiz(fieltro, 0.8)));
      ala.rotation.x = -s * Math.PI / 2;
      deformar(ala, (v) => { const r = Math.hypot(v.x, v.y); if (r > 0.15) v.z += (r - 0.15) * (r - 0.15) * 1.6 * (0.45 + 0.55 * Math.abs(v.x) / r) * s; });
      ala.position.set(0, 0.128 + (s > 0 ? 0.005 : -0.005), -0.004);
      cabeza.add(ala);
    }
    // el borde del ala, con su espesor
    const borde = deformar(new THREE.Mesh(new THREE.TorusGeometry(0.245, 0.0065, 5, 40), color(matiz(fieltro, 0.9))), (v) => {
      const r = Math.hypot(v.x, v.y); v.z += (r - 0.15) * (r - 0.15) * 1.6 * (0.45 + 0.55 * Math.abs(v.x) / r);
    });
    borde.rotation.x = -Math.PI / 2; borde.position.set(0, 0.128, -0.004);
    cabeza.add(borde);
  } else if (colores.gorro === 'gorro') {
    cabeza.add(torno(ropa, [[0.105, 0.0], [0.11, 0.03], [0.108, 0.06], [0.09, 0.09], [0.05, 0.104], [0.0, 0.108]], [0, 0.112, -0.004], [-0.08, 0, 0], null, 16));
    cabeza.add(deformar(bola(matiz(ropa, 0.7), [0.1, 0.012, 0.075], [0, 0.118, 0.083], [-0.18, 0, 0], [14, 6]), (v) => { if (v.z < 0) v.z *= 0.15; }));   // la visera
  }
  g.add(cabeza);

  compactar(g, { alto: 1.75, pie: 0.8, panza: 0.1, todo: true });
  // la mano derecha, donde va el mate, la caña o la planilla
  let mano = brazos[1].userData.ante, mateVisible = null;
  if (muneca) {
    // 3.5.2: la mano y el mate son una sola malla; `mateVisible` (lo que antes era el mate suelto)
    // guarda el mate dibujando sólo la parte de la mano
    mano = muneca;
    const unida = muneca.children.find((o) => o.isMesh), iMano = muneca.userData.indicesMano;
    mateVisible = new THREE.Object3D();
    let ver = true;
    Object.defineProperty(mateVisible, 'visible', { configurable: true, get: () => ver, set: (v) => { ver = !!v; if (unida) unida.geometry.setDrawRange(0, ver ? Infinity : iMano); } });
  }
  return { g, cabeza, torso, patas, brazos, mano, muneca, mateVisible };
}

// ---------------------------------------------------------------- creación
// Cada personaje camina entre sus puntos y hace algo al llegar
const suave = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function caminarHacia(g, dt, destino, velocidad, T, col, cerca = 0.5) {
  const dx = destino.x - g.pos.x, dz = destino.z - g.pos.z;
  const d = Math.hypot(dx, dz);
  if (d < cerca) { g.vel = 0; return true; }
  const rumbo = Math.atan2(dx, dz);
  g.rumboObjetivo = rumbo;
  g.vel = velocidad;
  // 3.6: sin pasarse del punto (el último tramo de la gente con horario es de centímetros)
  const paso = Math.min(velocidad * dt, d);
  const nx = g.pos.x + Math.sin(rumbo) * paso, nz = g.pos.z + Math.cos(rumbo) * paso;
  // 3.6: `sinChoque`: el tramo de la puerta para adentro (y de adentro a la puerta) de un
  // edificio de la aldea no se frena contra el marco ni contra un mueble
  if (!T.agua(nx, nz)) { g.pos.x = nx; g.pos.z = nz; if (!destino.sinChoque) col.resolver(g.pos, 0.3); }
  g.pos.y = alturaDePie(T, col, g.pos.x, g.pos.z, g.pos.y);
  return false;
}

// Sobre qué se para: si hay un entablado o un muelle debajo, ahí; si no, el suelo
export function alturaDePie(T, col, x, z, yActual = 0) {
  const suelo = T.altura(x, z);
  if (col && col.plataformaEn) {
    const p = col.plataformaEn(x, z, Math.max(yActual, suelo) + 0.6);
    if (p && p.alto > suelo - 0.1 && p.alto < suelo + 4) return p.alto;
  }
  return suelo;
}

// El saludo cambia según la hora, el clima y la estación
export function saludoDe(npc, mundo) {
  const h = mundo.horas;
  const momento = h < 7 ? 'madrugada' : h < 12 ? 'mañana' : h < 19.5 ? 'tarde' : 'noche';
  const variantes = {
    ramon: {
      madrugada: 'Temprano andás. Recién prendí el fuego, si querés esperá que caliente el agua.',
      mañana: '¿Qué andás haciendo por acá arriba? Sentate un rato.',
      tarde: 'Buenas. A esta hora el viento se calma y se escucha todo.',
      noche: 'Mirá la hora. Si vas a bajar, andá despacio que el sendero engaña de noche.',
      lluvia: 'Con esta lluvia no se anda. Ponete abajo del alero, que en un rato afloja.',
      invierno: 'Frío, ¿no? Cuarenta inviernos acá y todavía me sorprende.',
      otono: 'Mirá cómo se puso el bosque. Dos semanas dura así, ni una más.',
    },
    ema: {
      madrugada: 'Buenas. Salgo temprano porque a esta hora los animales todavía andan.',
      mañana: 'Buenas. Estoy haciendo el recorrido del sendero, ¿todo bien?',
      tarde: 'Buenas. Voy anotando lo que veo, ya termino la vuelta.',
      noche: 'Qué hacés a esta hora acá. ¿Tenés dónde parar?',
      lluvia: 'Días así son los mejores para el bosque y los peores para el cuaderno.',
      invierno: 'Con nieve cambia todo el recorrido. Se ven las huellas, eso sí.',
      otono: 'En otoño hago el censo de lengas. Se ve mejor cuáles están enfermas.',
    },
    nicanor: {
      madrugada: 'Justo la mejor hora. No hagas ruido.',
      mañana: 'Justo estaba mirando el agua. ¿Sacaste algo hoy?',
      tarde: 'Ahora pica poco. Hay que esperar que baje el sol.',
      noche: 'A esta hora ya guardé todo. Pero sentate igual.',
      lluvia: 'Con lluvia el pique mejora, aunque uno termine empapado.',
      invierno: 'El agua está helada. Igual salgo, pero poco rato.',
      otono: 'Las marrones están grandes en esta época. Ojo con el hilo.',
    },
    guarda: {
      madrugada: 'Primer servicio del día. Va despacio, como siempre.',
      mañana: 'Bienvenido a bordo. Acomodate donde quieras, que va a haber lugar.',
      tarde: 'Suba, suba. A esta hora el viaje es el más lindo.',
      noche: 'Último servicio. Vamos con el faro prendido.',
      lluvia: 'Con lluvia el techo suena que da gusto. Ya va a ver.',
      invierno: 'Si nieva fuerte, paramos y esperamos. No es la primera vez.',
      otono: 'Del lado de la ventanilla izquierda se ven las lengas coloradas.',
    },
  };
  const v = variantes[npc.clave];
  if (!v) return npc.saludo;
  if (mundo.lluvia > 0.5 && v.lluvia) return v.lluvia;
  if (mundo.invierno > 0.6 && v.invierno) return v.invierno;
  if (mundo.otono > 0.6 && v.otono) return v.otono;
  return v[momento] || npc.saludo;
}

export function crearGente(T, escena, col, sonido) {
  const r = rng(31415);
  const gente = [];
  const L = T.lugares;

  function ubicarJunto(base, rot, dx, dz) {
    const x = base.x + dx * Math.cos(rot) + dz * Math.sin(rot);
    const z = base.z - dx * Math.sin(rot) + dz * Math.cos(rot);
    return { x, z };
  }

  function agregar(clave, colores, pos, mirandoA, extra = {}) {
    const m = mallaPersona(colores, clave, !!extra.conMate);
    const y = alturaDePie(T, col, pos.x, pos.z, pos.y || 0);
    m.g.position.set(pos.x, y, pos.z);
    const rumbo = Math.atan2(mirandoA.x - pos.x, mirandoA.z - pos.z);
    m.g.rotation.y = rumbo;
    escena.add(m.g);
    const p = PERSONAJES[clave];
    const npc = {
      ...m, clave, ...p, pos: m.g.position, rumbo, rumboObjetivo: rumbo, vel: 0, paso: 0,
      fase: r() * 6, historias: HISTORIAS.filter((h) => h.quien === clave),
      casa: { x: pos.x, z: pos.z }, etapa: 0, espera: 1 + r() * 3, ...extra,
    };
    gente.push(npc);
    return npc;
  }

  // Lo que cada uno lleva en la mano
  // 3.4: el mate es una calabaza con su virola y la bombilla
  // 3.5.2: ahora va en la mano, fundido con ella (ver el brazo del mate en mallaPersona): el que
  // toma mate se arma con `conMate`; `npc.mate` es lo que lo muestra o lo guarda
  function darMate(npc) {
    npc.mate = npc.mateVisible || null;
  }
  function darCaña(npc) {
    const caña = new THREE.Group();
    const vara = palo(lam('#5a4530'), 0.012, 2.1, [0, 0.95, 0], [0.35, 0, 0]);
    caña.add(vara);
    caña.add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.03, 8), lam('#4e4a44')));
    compactar(caña, { todo: true });
    npc.mano.add(caña);
    npc.caña = caña;
  }
  function darPlanilla(npc) {
    const tabla = new THREE.Group();
    tabla.add(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.3, 0.02), lam('#8a6b4a')));
    tabla.add(new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.26, 0.012), lam('#efe7d4')));
    compactar(tabla, { todo: true });
    tabla.rotation.set(-1.1, 0, 0);
    tabla.position.set(0, -0.02, 0.1);
    npc.mano.add(tabla);
    npc.planilla = tabla;
  }

  // Si por alguna razón faltara su lugar, el personaje igual aparece cerca del refugio
  const puesto = (base, rot, dx, dz, respaldo) => {
    if (base) return { p: ubicarJunto(base, rot ?? 0, dx, dz), mira: base };
    const ref = L.refugio;
    const q = ubicarJunto(ref, ref.rot ?? 0, respaldo[0], respaldo[1]);
    return { p: q, mira: ref };
  };
  // Don Ramón: entre el banco, la leña y la puerta de su puesto, siempre con el mate
  {
    const { p, mira } = puesto(L.puesto, L.puesto && L.puesto.rot, 1.55, 2.62, [5.5, 6.5]);
    const base = L.puesto || L.refugio;
    const rot = base.rot ?? 0;
    const ruta = [
      { ...ubicarJunto(base, rot, 1.55, 2.62), quieto: 14, mirar: base },
      { ...ubicarJunto(base, rot, 3.4, -1.6), quieto: 9 },
      { ...ubicarJunto(base, rot, -0.65, 3.18), quieto: 11, mirar: { x: base.x + (base.x - p.x) * 4, z: base.z + (base.z - p.z) * 4 } },
    ];
    const npc = agregar('ramon', { ropa: '#9a8b6c', abrigo: '#6b4a3a', poncho: true, gorro: 'boina', barba: '#c8c4bc' }, p, mira, { ruta, velocidad: 0.65, conMate: true });
    darMate(npc);
  }
  // Nicanor: de la cabaña a la orilla, donde se queda pescando un buen rato
  {
    const { p } = puesto(L.cabana, L.cabana && L.cabana.rot, -0.72, 3.32, [-4.5, 7]);
    const mira = L.cabana ? { x: L.cabana.x + (L.cabana.x - p.x) * 6, z: L.cabana.z + (L.cabana.z - p.z) * 6 } : { x: LAGO.x, z: LAGO.z };
    // busca un lugar en la orilla, cerca de la cabaña
    let orilla = null;
    for (let i = 0; i < 400 && !orilla; i++) {
      const a2 = (i / 400) * Math.PI * 2;
      const rad = T.radioLago(a2) * 0.98;
      const x = LAGO.x + Math.cos(a2) * rad, z = LAGO.z + Math.sin(a2) * rad;
      if (T.agua(x, z) || T.altura(x, z) < 0.4) continue;
      if (Math.hypot(x - p.x, z - p.z) < 26) orilla = { x, z };
    }
    const ruta = [
      { x: p.x, z: p.z, quieto: 10, mirar: mira },
      orilla ? { ...orilla, quieto: 26, pescando: true, mirar: LAGO } : { x: p.x, z: p.z, quieto: 20, mirar: LAGO },
    ];
    const npc = agregar('nicanor', { ropa: '#4f6d7a', abrigo: '#2f4756', gorro: 'gorro', barba: '#8a8378' }, p, mira, { ruta, velocidad: 0.8 });
    darCaña(npc);
  }
  // Ema: recorre un tramo del sendero cerca del mirador, anotando lo que ve
  {
    const m = L.mirador;
    const hacia = m ? Math.atan2(150 - m.x, 110 - m.z) : 0;
    const { p, mira } = puesto(m, hacia, 2.2, 2.6, [0, 8]);
    // tramo de sendero más cercano al mirador
    let mejor = 0, dm = Infinity;
    T.sendero.forEach((q, i) => { const d = Math.hypot(q.x - p.x, q.z - p.z); if (d < dm) { dm = d; mejor = i; } });
    const paso = Math.max(6, Math.floor(T.sendero.length / 60));
    const ruta = [
      { x: p.x, z: p.z, quieto: 12, mirar: mira },
      { x: T.sendero[mejor].x, z: T.sendero[mejor].z, quieto: 5 },
      { x: T.sendero[(mejor + paso) % T.sendero.length].x, z: T.sendero[(mejor + paso) % T.sendero.length].z, quieto: 8, anotando: true },
      { x: T.sendero[(mejor + paso * 2) % T.sendero.length].x, z: T.sendero[(mejor + paso * 2) % T.sendero.length].z, quieto: 6, anotando: true },
      { x: T.sendero[(mejor + paso) % T.sendero.length].x, z: T.sendero[(mejor + paso) % T.sendero.length].z, quieto: 4 },
    ];
    const npc = agregar('ema', { ropa: '#7e8c5a', abrigo: '#4a5a34', gorro: 'sombrero', pelo: '#3a2a1e' }, p, mira, { ruta, velocidad: 0.95 });
    darPlanilla(npc);
  }

  // Ercilia: el almacén deja de sentirse vacío. Trabaja detrás del mostrador,
  // recorre los anaqueles y mira hacia la puerta cuando alguien entra.
  // Su contenido (historias y saludo) existía desde hace tiempo, pero nunca se
  // había instanciado como personaje en el mundo.
  if (L.almacen) {
    const base = L.almacen;
    const rot = base.rot ?? 0;
    const frente = ubicarJunto(base, rot, 0, -3.0);
    const p = ubicarJunto(base, rot, -1.35, 1.30);
    const ruta = [
      { ...p, quieto: 16, mirar: frente, atendiendo: true },
      { ...ubicarJunto(base, rot, 1.35, 1.30), quieto: 9, mirar: frente, atendiendo: true },
      { ...ubicarJunto(base, rot, 0.45, 1.82), quieto: 8, anotando: true, mirar: frente },
      { ...ubicarJunto(base, rot, -0.75, 1.58), quieto: 7, mirar: frente, atendiendo: true },
    ];
    const npc = agregar('ercilia', {
      ropa: '#7f5a45', abrigo: '#594138', gorro: 'boina', pelo: '#4a352a', bufanda: '#a88a63',
    }, p, frente, { ruta, velocidad: 0.55 });
    // La libreta de fiado da contexto visual a sus historias y a la función del local.
    darPlanilla(npc);
  }

  // Elsa viaja en el tren: su posición la fija el propio tren en cada cuadro
  let guarda = null;
  {
    const m = mallaPersona({ ropa: '#3f4a63', abrigo: '#2b3346', gorro: 'gorro', pelo: '#2e2622' }, 'guarda');
    m.g.visible = false;
    escena.add(m.g);
    const p = PERSONAJES.guarda;
    guarda = { ...m, clave: 'guarda', ...p, pos: m.g.position, rumbo: 0, fase: 0, historias: HISTORIAS.filter((h) => h.quien === 'guarda'), aBordo: true };
    gente.push(guarda);
  }

  const tmp = new THREE.Vector3(), adelante = new THREE.Vector3(), adelantePlano = new THREE.Vector3();

  // 3.6: `deFrente`: sólo el que tenés de frente y a mano (al lado de un mostrador o de algo para
  // hacer, un cliente o la que atiende no te tapan la E si no los mirás a ellos)
  function cerca(js, camara, deFrente = false) {
    camara.getWorldDirection(adelante);
    adelantePlano.set(adelante.x, 0, adelante.z).normalize();
    const minimo = deFrente ? 0.9 : 0.45;
    let mejor = null, mejorD = deFrente ? 2.4 : 3.6;
    for (const g of gente) {
      if (g.aBordo && !g.enViaje) continue;
      const d = Math.hypot(g.pos.x - js.pos.x, g.pos.z - js.pos.z);
      if (d > mejorD) continue;
      tmp.set(g.pos.x - camara.position.x, 0, g.pos.z - camara.position.z).normalize();
      if (tmp.dot(adelantePlano) < minimo) continue;
      mejorD = d; mejor = g;
    }
    return mejor;
  }

  function actualizar(dt, js, camara, hablando, presupuestoNivel = 0) {
    for (const g of gente) {
      // 3.6: la gente de la aldea con vos lejos (a más de 150 m): ni se dibuja ni se mueve.
      // aldea-gente.js la va dejando donde le toca estar a cada hora.
      if (g.dormido) { if (g.g.visible) g.g.visible = false; continue; }
      const d = Math.hypot(g.pos.x - js.pos.x, g.pos.z - js.pos.z);
      // (3.6: el que está adentro de un edificio de la aldea se ve sólo de cerca, `soloCerca`)
      g.g.visible = g.aBordo ? !!g.enViaje && d < 40 : d < (g.soloCerca || 130);
      limitarSombrasPorDistancia(g.g, d, 48);
      if (!g.g.visible) continue;
      g.fase += dt;
      // rutina: camina hasta su próximo punto y se queda un rato haciendo lo suyo
      const charlando = hablando === g;
      // en el Desafío, los vecinos instalados en la base siguen con lo suyo aunque pases cerca
      // 1.11: el que viene de visita no se frena a mitad de camino: llega a la mesa y ahí te mira
      // 3.6: los vecinos de la aldea que charlan entre ellos se miran a ellos, no a vos
      // 3.6.1: el que invitaste a tomar algo va con vos: no se frena porque estés al lado (si lo
      // acompañabas a la casa de té, se quedaba parado en la calle esperando que te alejaras)
      const cerquita = d < 7 && !g.enBase && !(g.deVisita && g.espera <= 0) && !g.charlaVecinos && !g.enCita;
      let etapa = g.ruta ? g.ruta[g.etapa % g.ruta.length] : null;
      if (g.camino && !charlando && !cerquita) {
        // 3.6: con horario (la gente de la aldea): `camino` son los puntos que faltan (por las
        // calles, ver aldea-gente.js); en el último se queda mirando hacia `miraFinal`
        if (g.camino.length) {
          const q = g.camino[0];
          if (caminarHacia(g, dt, q, g.velocidad || 0.8, T, col, q.cerca ?? 0.5)) g.camino.shift();
        } else {
          g.vel = 0;
          if (Number.isFinite(g.miraFinal)) g.rumboObjetivo = g.miraFinal;
        }
      } else if (g.ruta && !charlando && !cerquita && !g.aBordo) {
        if (g.espera > 0) {
          g.espera -= dt;
          g.vel = 0;
          if (etapa.mirar) g.rumboObjetivo = Math.atan2(etapa.mirar.x - g.pos.x, etapa.mirar.z - g.pos.z);
          if (g.espera <= 0) { g.etapa = (g.etapa + 1) % g.ruta.length; etapa = g.ruta[g.etapa]; }
        } else if (caminarHacia(g, dt, etapa, g.velocidad || 0.8, T, col)) {
          g.espera = etapa.quieto || 8;
        }
      } else {
        g.vel = 0;
        // (3.6: sentado o en lo suyo, con vos cerca no se da vuelta: sólo si le hablás)
        if (charlando || (cerquita && !g.pose)) g.rumboObjetivo = Math.atan2(js.pos.x - g.pos.x, js.pos.z - g.pos.z);
      }
      // giro suave hacia donde mira
      const actual = g.g.rotation.y;
      g.rumbo = actual + Math.atan2(Math.sin(g.rumboObjetivo - actual), Math.cos(g.rumboObjetivo - actual)) * Math.min(1, dt * 2.6);
      g.g.rotation.y = g.rumbo;

      // RC23: locomoción/rutina siguen continuas, pero huesos y gestos de NPCs
      // lejanos se recalculan a menor frecuencia. Cerca o charlando = tiempo real.
      g.paso += dt * (2.6 + g.vel * 5);
      g.__poseAcum = (g.__poseAcum || 0) + dt;
      const pasoPose = (charlando || d < 38) ? 0 : (d < 85 ? 1 / Math.max(6, 12 - presupuestoNivel * 2) : 1 / Math.max(4, 8 - presupuestoNivel));
      const actualizarPose = pasoPose === 0 || g.__poseAcum >= pasoPose;
      if (actualizarPose) {
        g.__poseAcum = 0;
        const respira = Math.sin(g.fase * 1.4) * 0.02;
        const andando = g.vel > 0.05;
        // 3.5: el cuerpo sube cuando las piernas se cruzan y baja con el paso abierto (antes al revés)
        const bote = andando ? (1 - Math.abs(Math.sin(g.paso))) * 0.03 : 0;
        g.torso.position.y = 0.82 + respira + bote;
        g.cabeza.position.y = 1.46 + respira + bote;
        // 3.5: la rodilla dobla al llevar la pierna adelante y se estira al apoyar; caderas y
        // hombros giran apenas contra el paso, el peso se pasa de un lado al otro y la cabeza
        // compensa. Parado, el peso se mece despacio.
        // 3.5: parado en una ladera, cada pie busca su suelo: el cuerpo baja hasta el pie de
        // abajo y la pierna de arriba dobla la rodilla (antes un pie flotaba y el otro se hundía)
        let bajaObj = 0, alza0 = 0, alza1 = 0;
        if (!andando && Math.abs(g.pos.y - T.altura(g.pos.x, g.pos.z)) < 0.03) {
          const cr = Math.cos(g.g.rotation.y), sr = Math.sin(g.g.rotation.y);
          const h0 = T.altura(g.pos.x - 0.115 * cr + 0.05 * sr, g.pos.z + 0.115 * sr + 0.05 * cr) - g.pos.y;
          const h1 = T.altura(g.pos.x + 0.115 * cr + 0.05 * sr, g.pos.z - 0.115 * sr + 0.05 * cr) - g.pos.y;
          // (con tope: más alto, la rodilla saldría por delante del poncho o la pollera)
          const tope = g.mate || R_PONCHO.has(g.clave) || g.conPoncho ? 0.035 : 0.07;   // (3.6: y los de poncho de la aldea)
          bajaObj = Math.min(0.1, Math.max(0, -Math.min(h0, h1)));
          alza0 = Math.min(tope, h0 + bajaObj); alza1 = Math.min(tope, h1 + bajaObj);
        }
        g.baja = (g.baja || 0) + (bajaObj - (g.baja || 0)) * 0.25;
        g.torso.position.y -= g.baja; g.cabeza.position.y -= g.baja;
        g.brazos[0].position.y = 1.3 - g.baja; g.brazos[1].position.y = 1.3 - g.baja;
        g.patas.forEach((p2, i) => {
          const f = g.paso + i * Math.PI;
          p2.position.y = 0.82 - g.baja;
          const alza = Math.sqrt(Math.max(0, i ? alza1 : alza0) / 0.41);
          p2.rotation.x = andando ? Math.sin(f) * 0.5 : -alza;
          const rod = p2.userData.rodilla;
          if (rod) rod.rotation.x = andando ? 0.1 + Math.max(0, -Math.cos(f)) * 0.75 : 0.03 + alza * 2;
        });
        g.torso.rotation.y = andando ? Math.sin(g.paso) * 0.06 : 0;
        g.torso.rotation.z = andando ? Math.cos(g.paso) * 0.022 : Math.sin(g.fase * 0.45) * 0.012;
        g.torso.rotation.x = andando ? 0.035 : 0;
        g.cabeza.rotation.y = -g.torso.rotation.y * 0.7;
        g.cabeza.rotation.x = charlando ? Math.sin(g.fase * 5) * 0.05 : Math.sin(g.fase * 0.5) * 0.06;

        // gestos según lo que esté haciendo
        const quieto = !andando && !charlando;
        const tarea = quieto && g.espera > 0 && etapa ? etapa : null;
        let bIzq = 0, bDer = 0, giroMate = 0, inclinaMate = 0;
        if (charlando) { bIzq = Math.sin(g.fase * 3.5) * 0.25; bDer = -bIzq * 0.7; }
        else if (andando) { bIzq = Math.sin(g.paso + Math.PI) * 0.3; bDer = Math.sin(g.paso) * 0.3; }
        else if (g.mate) {
          const ciclo = (g.fase % 9) / 9;
          // 3.5: sube y baja el mate de a poco (antes el brazo saltaba de golpe)
          // 3.5.2: el codo sube y gira hacia adentro y el mate llega a la boca, apenas inclinado
          // (antes se estiraba el brazo); con el mate guardado, no toma
          const k = g.mate.visible === false ? 0 : suave(0.55, 0.6, ciclo) * (1 - suave(0.73, 0.78, ciclo));
          if (g.muneca) { bDer = -0.05 + (TOMAR_MATE.x + 0.05) * k; giroMate = TOMAR_MATE.y * k; inclinaMate = TOMAR_MATE.inclina * k; }
          else bDer = -0.25 - 1.2 * k;
          g.cabeza.rotation.x -= 0.18 * k;
        } else if (g.caña && tarea && tarea.pescando) {
          const ciclo = (g.fase % 12) / 12;
          const k = suave(0.8, 0.84, ciclo) * (1 - suave(0.97, 1, ciclo));
          bDer = -0.75 + k * (-0.5 + Math.sin(g.fase * 9) * 0.35);
        } else if (g.planilla && tarea && tarea.anotando) {
          bDer = -1.2; bIzq = -0.5 + Math.sin(g.fase * 3) * 0.06;
          g.cabeza.rotation.x += 0.22;
        } else if (g.caña) bDer = -0.7;
        g.brazos[0].rotation.x = bIzq;
        g.brazos[1].rotation.x = bDer;
        // los brazos no van pegados al cuerpo: se abren apenas, un poco más al caminar
        g.brazos[0].rotation.z = andando ? -0.07 : -0.035;
        g.brazos[1].rotation.z = andando ? 0.07 : 0.035;
        if (g.pose && !andando) posar(g, charlando);   // 3.6 (vida)
        if (g.muneca) {
          // 3.5.2: el que lleva el mate: el brazo se mece menos y la muñeca se contra-gira para
          // que el mate quede derecho (o apenas inclinado hacia la boca al tomar)
          g.brazos[1].rotation.x *= andando || charlando ? 0.5 : 1;
          g.brazos[1].rotation.y = giroMate;
          _qMate.copy(g.brazos[1].quaternion).invert();
          g.muneca.quaternion.copy(_qMate.multiply(_qInclina.setFromEuler(_eMate.set(inclinaMate, 0, 0))));
        }
      }
    }
  }

  function ubicarGuarda(p, rumbo, enViaje) {
    if (!guarda) return;
    guarda.enViaje = enViaje;
    if (!enViaje) return;
    guarda.pos.set(p.x, p.y, p.z);
    guarda.rumbo = rumbo;
  }

  // 3.1: los pobladores (3.6: y los vecinos de la Aldea de los Duendes, ver aldea-gente.js).
  // Son gente como los demás: se paran a charlar y E habla con ellos. 3.6: con `camino: []`
  // andan con horario (no recorren una ruta en vuelta) y `talla` los hace más bajitos (los chicos).
  function agregarPoblador(def) {
    const npc = agregar(def.clave, def.colores || {}, def.pos, def.mira || { x: def.pos.x, z: def.pos.z + 1 }, {
      nombre: def.nombre, oficio: def.oficio, saludo: def.saludo, despedida: def.despedida,
      historias: [], ruta: def.ruta || [{ x: def.pos.x, z: def.pos.z, quieto: 99999 }], velocidad: def.velocidad || 0.8, poblador: true,
      conMate: def.mano === 'mate',
    });
    if (def.mano === 'mate') darMate(npc);
    else if (def.mano === 'cana') darCaña(npc);
    else if (def.mano === 'planilla') darPlanilla(npc);
    if (Array.isArray(def.camino)) { npc.camino = def.camino; npc.ruta = null; npc.miraFinal = npc.rumbo; }
    if (Number.isFinite(def.talla) && def.talla > 0.3 && def.talla < 1) npc.g.scale.setScalar(def.talla);
    npc.conPoncho = !!def.colores?.poncho;
    return npc;
  }

  return { gente, cerca, actualizar, guarda, ubicarGuarda, agregarPoblador };
}
