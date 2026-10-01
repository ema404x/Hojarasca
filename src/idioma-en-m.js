// Tanda M (era la K de la rama 1.10): la 1.10 en inglés. La huerta, la majada, el correo, las tormentas, el zaino,
// el excavador, la vuelta, los logros del Relax y el cuaderno para compartir.
//
// Lo que se arma con huecos que el traductor no traduce (lo que cae en un {0} pasa tal
// cual) se genera por combinación: si no, "Sembrar habas" saldría "Sow habas".
// Mismos términos que el resto: errands, supply pile, workbench, Shearing Shed.

import { CARTAS } from './correo.js';
import { LOGROS_RELAX } from './logros-relax.js';

const K = {
  // ---------------------------------------------------------------- el cuaderno
  'Del campo': 'From the land',
  'Cartas': 'Letters',
  'Recibida': 'Received',
  'Cosechado por primera vez': 'First harvested',
  'La carta queda en el cuaderno': 'The letter stays in your notebook',
  'Habas': 'Broad beans',
  'Se siembran en un cantero (O → Trabajo) con semilla del almacén.': 'Sown in a garden bed (O → Work) with seed from the store.',
  'Llegaron al sur con los colonos y se quedaron: aguantan el frío y la tierra pobre mejor que casi cualquier cosa de huerta. Las chauchas se abren a mano y los granos verdes se comen salteados.': 'They came south with the settlers and stayed: they stand the cold and poor soil better than almost anything in a garden. The pods are split by hand and the green beans eaten sautéed.',
  'Papa': 'Potato',
  'Tarda una semana en el cantero, pero rinde.': 'It takes a week in the bed, but it yields.',
  'Chiloé, del otro lado de la cordillera, es uno de los centros de origen de la papa: los huilliches cultivaban cientos de variedades. En la Patagonia se siembra en primavera y se aporca cuando asoma la mata.': 'Chiloé, across the mountains, is one of the places the potato comes from: the Huilliche grew hundreds of varieties. In Patagonia it goes in during spring and is hilled up once the plant shows.',
  'Frutilla de cantero': 'Garden strawberry',
  'Se siembra de un estolón de las silvestres.': 'Grown from a runner of the wild ones.',
  'La misma frutilla del sendero, pero en tierra removida y sin competir con el pasto: da más, más pareja y más grande. Así empezó a cultivarse, hace siglos, en el sur de Chile.': 'The same strawberry as by the trail, but in turned soil and without fighting the grass: more of them, more even and bigger. That is how it was first cultivated, centuries ago, in southern Chile.',
  'Vellón de lana': 'Wool fleece',
  'de la majada del galpón': 'from the flock at the Shearing Shed',
  'Con la tijera, en el corral del galpón de esquila.': 'With the shears, in the corral at the Shearing Shed.',
  'Sale entero, como una manta: se esquila de la panza al lomo y la lana queda unida. Se lava, se carda y se hila. Con dos se teje una alfombra.': 'It comes off whole, like a blanket: you shear from belly to back and the wool holds together. It gets washed, carded and spun. Two of them make a rug.',
  'Oveja': 'Sheep',
  'Ovis aries · Corriedale y Merino': 'Ovis aries · Corriedale and Merino',
  'En el corral grande del galpón de esquila.': 'In the big corral at the Shearing Shed.',
  'Llegaron a la Patagonia a fines del siglo XIX y cambiaron todo: los galpones, los alambrados, los pueblos. La Corriedale, de cara negra, da carne y lana; la Merino, de lana más fina, aguanta mejor el frío seco de la meseta. La lana les vuelve a crecer en pocas semanas.': 'They reached Patagonia in the late nineteenth century and changed everything: the sheds, the fences, the towns. The black-faced Corriedale gives meat and wool; the Merino, with finer wool, stands the dry cold of the plateau better. Their wool grows back in a few weeks.',
  'Papas al rescoldo': 'Potatoes in the embers',
  'Tres papas de tu cantero, enterradas en las brasas.': 'Three potatoes from your bed, buried in the coals.',
  'Se entierran enteras en la ceniza caliente y se olvidan media hora. Salen negras por fuera y harinosas por dentro; se parten con la mano y se comen con sal gruesa.': 'They go whole into the hot ash and get forgotten for half an hour. They come out black outside and floury inside; you break them open by hand and eat them with coarse salt.',
  'Habas salteadas': 'Sautéed broad beans',
  'Cuatro puñados de habas de tu cantero y un fuego.': 'Four handfuls of beans from your bed, and a fire.',
  'Se pelan las chauchas, se pasan los granos por la sartén con un poco de grasa y se comen tibios. Es comida de huerta de campo: lo que hay, cuando hay.': 'Shell the pods, run the beans through the pan with a little fat and eat them warm. Country garden food: what there is, when there is.',
  'Semillas de habas': 'Broad bean seeds',
  'cambiadas en el almacén': 'traded at the store',
  'cambiada en el almacén': 'traded at the store',
  'Ercilia las cambia por calafates y ramitas.': 'Ercilia trades them for calafate and twigs.',
  'Habas secas de la cosecha pasada, en un cucurucho de papel de diario. Cada una es una siembra.': 'Dried beans from last harvest, in a twist of newspaper. Each one is a sowing.',
  'Papa para semilla': 'Seed potato',
  'Ercilia la cambia por piñones y un canto rodado.': 'Ercilia trades it for piñones and a river stone.',
  'Papas chicas con los ojos ya brotados. Se entierran enteras o en pedazos, siempre con un ojo.': 'Small potatoes with the eyes already sprouting. They go in whole or in pieces, always with an eye.',
  'Tijera de esquilar': 'Sheep shears',
  'Ercilia la cambia por cantos rodados y una pluma.': 'Ercilia trades them for river stones and a feather.',
  'De hoja doble y resorte. Las comparsas de esquila recorrían las estancias en primavera con sus tijeras; hoy casi todo se esquila a máquina, pero en los puestos chicos todavía se usa esta.': 'Double-bladed, with a spring. Shearing gangs went from ranch to ranch every spring with shears like these; nearly everything is machine-shorn now, but the small outposts still use these.',
  'Llega con la trochita a la Estación del Valle; la guarda Ercilia en el almacén.': 'It comes on the narrow-gauge train to the Valley Station; Ercilia keeps it at the store.',
  'carta': 'letter',
  'El rayo': 'Lightning',
  'descarga eléctrica': 'electrical discharge',
  'En una tormenta fuerte, alguno cae cerca.': 'In a hard storm, one strikes close by.',
  'La descarga busca lo más alto y lo parte de arriba abajo: el agua de adentro del tronco hierve de golpe y lo abre. El árbol no se pierde: se hace leña, y del tocón vuelve a brotar.': 'The strike finds the highest thing and splits it top to bottom: the water inside the trunk boils all at once and bursts it open. The tree is not lost: it becomes firewood, and the stump sprouts again.',
  'Caballo criollo': 'Criollo horse',
  'Equus caballus · el zaino de Don Ramón': "Equus caballus · Don Ramón's bay",
  'Don Ramón te lo presta cuando ya caminaste el valle.': 'Don Ramón lends it to you once you have walked the valley.',
  'El criollo es chico, rústico y aguantador: baja de los caballos que trajeron los españoles y se hizo solo en la pampa y la meseta, a fuerza de frío y de pasto duro. En la Patagonia todo se movió a caballo hasta que llegaron el tren y la ruta.': 'The Criollo is small, rugged and hardy: it comes from the horses the Spanish brought and made itself on the pampa and the plateau, out of cold and tough grass. In Patagonia everything moved on horseback until the railway and the road arrived.',
  'El zaino': 'The bay horse',
  'Don Ramón te lo ofrece cuando ya caminaste las cuatro puntas.': 'Don Ramón offers it once you have walked the four corners.',
  'Dos vellones para el pelero, la manta que va entre el lomo y la montura. Sin pelero, al caballo le paspa el lomo.': "Two fleeces for the saddle pad, the blanket between the horse's back and the saddle. Without one, the back gets rubbed raw.",
  'Contestar las cartas': 'Answering letters',
  'encargo de Ercilia': "Ercilia's errand",
  'Ercilia te lo pide cuando te llegue la primera carta.': 'Ercilia asks you once your first letter arrives.',
  'El correo llega con el tren y se va con el tren. Cuatro cartas leídas, y la gente de allá deja de preocuparse.': 'The mail comes on the train and leaves on the train. Four letters read, and the people back home stop worrying.',
  'Verdura para el pueblo': 'Vegetables for town',
  'Llega con una carta de Esquel, cuando tengas un cantero.': 'It comes with a letter from Esquel, once you have a garden bed.',
  'Seis habas y cuatro papas para Rosa, en Esquel, que las recibe con el tren. Se paga en semilla buena.': 'Six handfuls of beans and four potatoes for Rosa in Esquel, who gets them by train. Paid in good seed.',
  'Lana para Amalia': 'Wool for Amalia',
  'Llega con una carta de Jacobacci, cuando hayas visto la majada.': 'It comes with a letter from Jacobacci, once you have seen the flock.',
  'Seis vellones enteros para Amalia, la del telar. La lana del sur, dice, es la mejor que hay.': 'Six whole fleeces for Amalia, the weaver. Southern wool, she says, is the best there is.',

  // ---------------------------------------------------------------- los encargos
  'Ya caminaste el valle de punta a punta: ahora te lo puedo prestar. El zaino es manso y conoce todo. Pero la montura no tiene pelero, y sin pelero le paspa el lomo. Traeme dos vellones de la majada del galpón y te lo ensillo.': "You've walked the valley end to end: now I can lend him to you. The bay is gentle and knows every path. But the saddle has no pad, and without one it rubs his back raw. Bring me two fleeces from the flock at the shed and I'll saddle him for you.",
  'Llevarle dos vellones de lana a Don Ramón para el pelero.': 'Bring Don Ramón two wool fleeces for the saddle pad.',
  'Así se ensilla. Te espera atado al palenque, al lado de la puerta del refugio. W al tranco, con apuro al galope, y no lo metas al agua honda que no le gusta. Cuidámelo.': "That's how you saddle a horse. He'll be tied to the hitching post by the shelter door. W to walk him on, gallop when you're in a hurry, and keep him out of deep water, he hates it. Look after him for me.",
  'el zaino, ensillado': 'the bay, saddled',
  'Mirá, acá el correo llega con el tren y se lo lleva el tren. Si vas a recibir cartas, las tenés que contestar, que si no la gente se preocupa. Cuando hayas leído cuatro, contame, que te doy algo para el viaje de vuelta de la tuya.': "Look, out here the mail comes in on the train and goes out on the train. If you're getting letters you have to answer them, or people worry. Once you've read four, let me know and I'll give you something for the trip back.",
  'Recibir y leer cuatro cartas en el almacén.': 'Receive and read four letters at the store.',
  'Cuatro cartas. Se nota que alguien te extraña. Tomá, un paquete de yerba para que tomes unos mates mientras contestás.': 'Four letters. Somebody misses you, that much is clear. Here, a pack of yerba so you can have a few mates while you write back.',
  'un kilo de yerba': 'a kilo of yerba',
  'Ya leíste lo de mi hermana. En Esquel la verdura llega en el camión del martes, medio machucada. Si juntás seis puñados de habas y cuatro papas de tu cantero, se las mando con el tren. Rosa paga en semilla, y la de ella es buena.': "You read my sister's letter. In Esquel the vegetables come on Tuesday's truck, half bruised. If you gather six handfuls of beans and four potatoes from your bed, I'll send them on the train. Rosa pays in seed, and hers is good.",
  'Juntar seis habas y cuatro papas de tu cantero.': 'Gather six handfuls of beans and four potatoes from your bed.',
  'Esto sí es verdura. Rosa va a estar contenta. Tomá la semilla que mandó: papa de la buena, de la que le trae el agrónomo.': "Now these are vegetables. Rosa will be happy. Here's the seed she sent: good potatoes, the kind the agronomist brings her.",
  'cuatro papas para semilla': 'four seed potatoes',
  'Amalia es la que teje las mantas grises, las que te gustaron. Si le juntás seis vellones de la majada del galpón, le hacés el invierno. La tijera la tengo acá, si todavía no tenés.': "Amalia's the one who weaves the grey blankets, the ones you liked. Gather her six fleeces from the flock at the shed and you'll make her winter. I've got shears here if you don't have any yet.",
  'Juntar seis vellones de lana (en la mochila o en el acopio).': 'Gather six wool fleeces (in your pack or in the supply pile).',
  'Seis vellones y bien esquilados, enteros. Amalia te manda esto: lo que le sobró de tablas a su marido cuando hizo el telar nuevo.': 'Six fleeces, well shorn and whole. Amalia sends you this: the planks her husband had left over from building the new loom.',
  'seis tablas': 'six planks',

  // ---------------------------------------------------------------- el almacén
  'De hoja doble y resorte de acero, como las de las comparsas que recorrían las estancias.': 'Double-bladed with a steel spring, like the ones the shearing gangs carried from ranch to ranch.',
  'Con ella se esquilan las ovejas del corral del galpón: dos vellones cada una.': 'For shearing the sheep in the corral at the shed: two fleeces each.',
  'Un cucurucho de papel de diario con habas secas de la cosecha pasada.': 'A twist of newspaper with dried beans from last harvest.',
  'Tres siembras para el cantero (O → Trabajo). Salen en cinco días.': 'Three sowings for the garden bed (O → Work). Ready in five days.',
  'Papas chicas con los ojos ya brotados, en una bolsa de arpillera.': 'Small potatoes with the eyes already sprouting, in a burlap sack.',
  'Dos siembras para el cantero. Tardan siete días, pero rinden.': 'Two sowings for the garden bed. They take seven days, but they yield.',
  'ya lo tenés · tenés {0}': 'you have it · you have {0}',
  'se puede · tenés {0}': 'you can · you have {0}',
  'falta juntar · tenés {0}': 'gather more · you have {0}',

  // ---------------------------------------------------------------- la huerta
  'Cantero de huerta': 'Garden bed',
  'Un cajón bajo de tablas lleno de tierra negra, con un borde de piedra. Se siembran habas, papas o frutillas (E) y crecen con los días; la lluvia las adelanta.': 'A low plank box full of black soil, with a stone edge. You sow broad beans, potatoes or strawberries (E) and they grow over the days; rain speeds them up.',
  'Cantero vacío: faltan semillas': 'Empty bed: no seeds',
  'Sembrar en el cantero': 'Sow in the bed',
  'No tenés qué sembrar': 'Nothing to sow',
  'Semillas de habas o de papa en el almacén, o una frutilla del sendero': 'Bean or potato seed at the store, or a strawberry from the trail',
  'Cada día de lluvia las adelanta uno': 'Each rainy day brings them one day closer',
  'En {0} días están. Cada día de lluvia las adelanta uno': 'Ready in {0} days. Each rainy day brings them one day closer',
  'Llevás {0}. Van al fuego o se vuelven a sembrar': 'You have {0}. For the fire, or to sow again',
  'La huerta está para cosechar': 'The garden is ready to harvest',
  'Un cantero listo': 'One bed ready',
  '{0} canteros listos': '{0} beds ready',
  'De tu cantero. Salteadas al fuego.': 'From your bed. Sautéed over the fire.',
  'De tu cantero. Al rescoldo, enterradas en la ceniza.': 'From your bed. In the embers, buried in the ash.',
  'Papas': 'Potatoes',
  'Para el cantero de la huerta (E).': 'For the garden bed (E).',
  'Coseché {0} del cantero.': 'Harvested {0} from the bed.',
  'Sembré {0}. Ahora a esperar.': 'Sowed {0}. Now we wait.',

  // ---------------------------------------------------------------- la majada
  'vellones de lana': 'wool fleeces',
  'Vellones de lana': 'Wool fleeces',
  'esquilar una oveja en el corral del galpón (E, con la tijera)': 'shear a sheep in the corral at the shed (E, with shears)',
  'De la majada del galpón. Con dos se teje una alfombra.': 'From the flock at the shed. Two make a rug.',
  'Con ella se esquilan las ovejas del corral del galpón (E).': 'For shearing the sheep in the corral at the shed (E).',
  'Alfombra gruesa de lana para cortar el frío del entablonado y dar identidad a una habitación sin ocupar circulación. Se teje con la lana de la majada del galpón.': 'A thick wool rug to cut the cold of the floorboards and give a room some character without getting in the way. Woven from the wool of the flock at the shed.',
  'Esquilar la oveja': 'Shear the sheep',
  'Oveja con el vellón entero': 'Sheep with a full fleece',
  'Recién esquilada · le falta un día': 'Just shorn · one day to go',
  'Recién esquilada · le faltan {0} días': 'Just shorn · {0} days to go',
  'Hace falta una tijera de esquilar': 'You need sheep shears',
  'Ercilia la cambia en el almacén': 'Ercilia trades them at the store',
  'Todavía está corta': 'Still too short',
  'En un día tiene el vellón entero': 'A full fleece in one day',
  'En {0} días tiene el vellón entero': 'A full fleece in {0} days',
  '+{0} vellones de lana': '+{0} wool fleeces',
  'Llevás {0}. Quedan {1} con el vellón entero': 'You have {0}. {1} still have a full fleece',
  'Llevás {0}. Esquilaste la majada entera': 'You have {0}. You sheared the whole flock',

  // ---------------------------------------------------------------- el correo
  'Llegó carta con el tren': 'A letter came on the train',
  'Antes tiene que llegarte una carta: la trae la trochita y la guarda Ercilia.': 'First a letter has to reach you: the narrow-gauge train brings it and Ercilia keeps it.',
  'En el almacén me esperaba carta de {0}.': 'A letter from {0} was waiting at the store.',
  'Me llegaron {0} cartas. Las leí en el almacén, parado.': '{0} letters came for me. I read them standing up at the store.',

  // ---------------------------------------------------------------- tormentas
  'El arroyo viene crecido': 'The creek is running high',
  'Con el agua turbia no pica nada en el arroyo. En el lago, en cambio, comen': 'With the water this muddy nothing bites in the creek. In the lake, though, they are feeding',
  'Quedó tirado: con el hacha se hace leña (H)': 'It is down: the axe turns it into firewood (H)',
  'El arroyo creció con la lluvia y bajaba marrón, arrastrando ramas.': 'The creek rose with the rain and ran brown, carrying branches.',
  'Cayó un rayo cerca. Partió un {0} de arriba abajo; todavía se sentía el olor a quemado.': 'Lightning struck close by. It split a {0} top to bottom; you could still smell the burning.',

  // ---------------------------------------------------------------- el zaino
  'Subir al zaino': 'Mount the bay',
  'Bajarte del zaino': 'Get off the bay',
  'Subiste al zaino': 'You mounted the bay',
  'W al trote, con Shift al galope. E para bajarte': 'W to trot, Shift to gallop. E to get off',
  'Bajaste del zaino': 'You got off the bay',
  'Queda acá. Volvé a subir con E': 'He stays here. E to mount again',
  'El zaino no entra al agua honda': 'The bay will not go into deep water',
  'Buscá un vado o bajate y seguí nadando': 'Find a ford, or get off and swim',
  'Con las riendas en la mano, no': 'Not with the reins in your hands',
  'Bajate del zaino con E': 'Get off the bay with E',
  'Anduve a caballo. El zaino conoce el valle mejor que yo: cuando dudo, lo dejo elegir.': 'Rode the horse. The bay knows the valley better than I do: when I am unsure, I let him choose.',

  // ---------------------------------------------------------------- el excavador
  '¡Un excavador pasó por debajo!': 'A digger went under!',
  'Dejó un pozo y los demás lo van a usar. Tapalo con dos piedras (E)': 'It left a hole and the others will use it. Fill it with two stones (E)',
  'Tapar el pozo (2 piedras)': 'Fill the hole (2 stones)',
  'Hacen falta dos piedras': 'You need two stones',
  'Se pican con el hacha en un pedrero (H)': 'Break them off a rock pile with the axe (H)',
  'Pozo tapado': 'Hole filled',
  'No queda ninguno abierto': 'None left open',
  'Hay un pozo abierto por un excavador: por ahí van a entrar los que vengan. Tapalo con dos piedras (E).': 'A digger left a hole open: that is where the next ones will come in. Fill it with two stones (E).',
  'Hay {0} pozos abiertos por los excavadores: por ahí van a entrar los que vengan. Cada uno se tapa con dos piedras (E).': 'Diggers left {0} holes open: that is where the next ones will come in. Each one takes two stones (E).',

  // ---------------------------------------------------------------- la vuelta
  'Otra vuelta, más difícil': 'Another round, harder',
  'Otra vuelta al Desafío': 'Another round of the Challenge',
  'Vuelta {0}': 'Round {0}',
  'Otra vuelta: vuelve a empezar desde la primera noche, sin base ni materiales, pero con tus armas, las mejoras y los planos. Los invasores vienen {0}% más, aguantan {1}% más y pegan {2}% más fuerte. ¿Vamos?': 'Another round: start over from the first night, with no base and no materials, but with your weapons, upgrades and blueprints. The invaders come {0}% more, last {1}% longer and hit {2}% harder. Ready?',

  // ---------------------------------------------------------------- el cuaderno para compartir
  'Llevarte el cuaderno': 'Take your notebook',
  'Todavía no hay nada para llevarse': 'Nothing to take yet',
  'Anotá algo, sacá fotos o dormí una noche para que se escriba el diario': 'Note something down, take photos, or sleep a night so the diary gets written',
  'Cuaderno guardado': 'Notebook saved',
  '{0} · {1} fotos y {2} páginas del diario': '{0} · {1} photos and {2} diary pages',
  'Cuaderno de campo': 'Field notebook',
  'Cuaderno del Desafío': 'Challenge notebook',
  'El álbum': 'The album',
  'El diario': 'The diary',
  'Lo anotado': 'Noted down',
  'sin la foto': 'no photo',
  'Día {0}, {1}': 'Day {0}, {1}',
  'Día {0} en el valle · {1} anotaciones · {2} fotos': 'Day {0} in the valley · {1} notes · {2} photos',
  'Día {0} en el valle · 1 anotación · {1} fotos': 'Day {0} in the valley · 1 note · {1} photos',
  'Día {0} en el valle · {1} anotaciones · 1 foto': 'Day {0} in the valley · {1} notes · 1 photo',
  'un bosque andino patagónico': 'an Andean Patagonian forest',
};

// ---------------------------------------------------------------- lo que va por combinación
const CULTIVO = { habas: 'broad beans', papas: 'potatoes', frutillas: 'strawberries', calafates: 'calafate berries' };
const ETAPA = { 'recién sembrado': 'just sown', brotando: 'sprouting', creciendo: 'growing' };
for (const [es, en] of Object.entries(CULTIVO)) {
  const Es = es.charAt(0).toUpperCase() + es.slice(1), En = en.charAt(0).toUpperCase() + en.slice(1);
  K[`Sembrar ${es}`] = `Sow ${en}`;
  K[`Sembraste ${es}`] = `You sowed ${en}`;
  K[`Cosechar ${es}`] = `Harvest ${en}`;
  K[`Cosechaste {0} de ${es}`] = `You harvested {0} ${en}`;
  for (const [ee, ei] of Object.entries(ETAPA)) {
    K[`${Es}: ${ee} · falta un día`] = `${En}: ${ei} · one day to go`;
    K[`${Es}: ${ee} · faltan {0} días`] = `${En}: ${ei} · {0} days to go`;
  }
}
// el rayo: especie × rumbo, con la distancia como hueco
const ESPECIE = { coihue: 'coihue', lenga: 'lenga', 'ciprés': 'cypress', 'arrayán': 'arrayán', 'ñire': 'ñire', 'árbol': 'tree' };
const RUMBO = { norte: 'north', noreste: 'northeast', este: 'east', sureste: 'southeast', sur: 'south', suroeste: 'southwest', oeste: 'west', noroeste: 'northwest' };
for (const [es, en] of Object.entries(ESPECIE)) {
  for (const [re, ri] of Object.entries(RUMBO)) K[`Un rayo partió un ${es} a {0} m al ${re}`] = `Lightning split a ${en} {0} m to the ${ri}`;
}
// las cartas: remitente, párrafos, la carta entera en el cuaderno y cómo te la da Ercilia
const CARTAS_EN = {
  'c-casa': ['Your sister, from Buenos Aires', [
    "Dear you: I'm writing to the store because the woman at the telephone office said everything gets there. Things are the same here, the heat and the noise. Mum asks whether you're eating.",
    "Tell me what it's like. I picture a postcard forest and I'm sure it isn't. Write back, even a short one; the mail is slow but it gets there.",
  ]],
  'c-esquel': ["Rosa, Ercilia's sister, from Esquel", [
    "Ercilia: they tell me there's someone new in the valley with a garden. Here in town vegetables come late and dear, on Tuesday's truck, and half bruised.",
    "If your neighbour has beans and potatoes to spare, send them on the train and I'll pay in good seed, the kind the agronomist brings me. A big hug, Rosa.",
  ]],
  'c-tejedora': ['Doña Amalia, weaver from Ingeniero Jacobacci', [
    "Señora Ercilia: this is Amalia, from the loom, the one who sold you the grey blankets. The shearing was poor this year and I have no wool for the winter orders.",
    "I hear there's a flock at the valley shed again. If someone gathers me some fleeces, I'll pay with whatever I have. Southern wool is the best there is, and I don't say that lightly.",
  ]],
  'c-ramal': ['The branch line office', [
    'Dear passenger: the conductor informs us that you have completed the full circuit of the line. Please accept our thanks for using the service.',
    'We remind you that the 75-centimetre gauge is the same as La Trochita, which has linked Ingeniero Jacobacci and Esquel since 1945 with Baldwin and Henschel engines from 1922. Take care of it; they do not make them anymore.',
  ]],
  'c-naturalista': ['A naturalist from Bariloche', [
    'Dear sir or madam: Ema, the park ranger, passed on your address. She tells me you keep a field notebook with more than twenty entries, and that you keep it well.',
    'A favour: if you see black-faced ibis, write down the time and the place. We are counting them all along the mountains and every record helps. What is written down with care is never lost.',
  ]],
  'c-vuelta': ['Your sister, from Buenos Aires', [
    'I got your letter. I read it three times and then read it to Mum, who cried a little and said you sound happy.',
    "I won't ask when you're coming back. I've understood that isn't the question. Send a photo of the lake; I want to put it on the fridge.",
  ]],
};
for (const c of CARTAS) {
  const en = CARTAS_EN[c.id];
  if (!en) continue;
  const [de, parrafos] = en;
  K[c.de] = de;
  c.texto.forEach((p, i) => { if (parrafos[i]) K[p] = parrafos[i]; });
  K[c.texto.join(' ')] = parrafos.join(' ');
  const deEs = `${c.de.charAt(0).toLowerCase()}${c.de.slice(1)}`;
  const deEn = `${de.charAt(0).toLowerCase()}${de.slice(1)}`;
  K[`De ${deEs}. La tiene Ercilia en el almacén`] = `From ${deEn}. Ercilia has it at the store`;
  K[`Llegó carta para vos con el tren. Es de ${deEs}. Tomá, leela tranquilo.`] = `A letter came for you on the train. It's from ${deEn}. Here, take your time with it.`;
}
// los logros del Relax, con su aviso
const LOGROS_EN = {
  libreta: ['Worn notebook', 'Note down 25 things in your field notebook.'],
  'cuaderno-lleno': ['Full notebook', 'Note down 100 things in your field notebook.'],
  'cuatro-puntas': ['The four corners', 'Set foot on the lookout, the outpost, the lighthouse and the station.'],
  'vuelta-entera': ['Without getting off', 'Ride the whole valley loop on the narrow-gauge train.'],
  'tres-hachazos': ['Three strokes', 'Fell your first tree.'],
  devolver: ['Give back what you took', 'Plant five saplings.'],
  'manos-tierra': ['Hands in the soil', 'Harvest something from your own garden bed.'],
  vellon: ['Shears and fleece', 'Shear your first sheep.'],
  'al-tranco': ['At a walk', "Get on Don Ramón's bay."],
  'mesa-completa': ['A full table', 'Cook everything the valley and your garden give.'],
  'tres-de-tres': ['Three for three', 'Catch and release a rainbow, a brown and a brook trout.'],
  rollo: ['A whole roll', 'Take ten photos.'],
  correo: ['Mail answered', 'Read four letters at the store.'],
  rayo: ['Smell of burning', 'See lightning strike close by.'],
  'de-aca': ['Someone from here', 'Finish every errand in the valley.'],
  constructor: ['Your own place', 'Finish an outpost of your own.'],
};
for (const l of LOGROS_RELAX) {
  const en = LOGROS_EN[l.id];
  if (!en) continue;
  K[l.nombre] = en[0];
  K[l.texto] = en[1];
  K[`Logro: ${l.nombre}`] = `Achievement: ${en[0]}`;
}

export const EN_M = K;
