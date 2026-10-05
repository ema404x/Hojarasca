// Tanda N (era la L de la rama 1.11): la 1.11 en inglés. El gallinero, la cocina de a dos, el telar, la feria de la
// estación, rastrear con el perro, las visitas, los pedidos de fotos, las órdenes a los
// compañeros, el cimiento de piedra y la carpeta sincronizada.
//
// Como en la tanda K: lo que lleva palabras adentro de un hueco se genera por
// combinación (un {0} pasa tal cual). Mismos términos que el resto: the store,
// Valley Station, Shearing Shed, workbench, errands, narrow-gauge train.

import { PEDIDOS, partesDeEnvio, dePara } from './correo.js';
import { OFERTAS, textoOferta } from './feria.js';
import { RASTREABLES, nombreRastro } from './rastreo.js';
import { VISITANTES } from './visitas.js';
import { ORDENES, NOMBRE_ORDEN, RESPUESTAS } from './desafio-ordenes.js';
import { RECETAS_FUEGO, textoPide } from './cocina.js';

const L = {
  // ---------------------------------------------------------------- el gallinero
  'Gallinero': 'Henhouse',
  'Una casilla baja de tablas con techo de una agua, nidal adentro y una escalerita. Viene con cuatro gallinas: ponen de día y los huevos se juntan con E.':
    'A low plank coop with a single-pitch roof, nesting box inside and a little ramp. It comes with four hens: they lay by day and you collect the eggs with E.',
  'Juntar huevos ({0})': 'Collect eggs ({0})',
  'Juntar huevos ({0}, el nidal está lleno)': 'Collect eggs ({0}, the nesting box is full)',
  'Juntar un huevo': 'Collect an egg',
  'Gallinero: el nidal está vacío': 'Henhouse: the nesting box is empty',
  'El nidal está vacío': 'The nesting box is empty',
  'Las gallinas ponen de día: mañana va a haber': 'Hens lay by day: there will be some tomorrow',
  'Juntaste un huevo': 'You collected an egg',
  'Juntaste {0} huevos': 'You collected {0} eggs',
  'Huevos': 'Eggs',
  'del gallinero': 'from the henhouse',
  'Armá un gallinero (O → Trabajo) y juntalos con E.': 'Build a henhouse (O → Work) and collect them with E.',
  'Las gallinas de campo ponen de día, en el nidal que les toca, y si no se los juntás se echan encima. Un huevo fresco de casa tiene la yema casi naranja: comen de todo lo que encuentran picoteando.':
    'Farm hens lay by day, each in her own nesting box, and if you don\'t collect the eggs they sit on them. A fresh home egg has an almost orange yolk: they eat everything they find pecking around.',
  'Gallina de campo': 'Farm hen',
  'Vienen con el gallinero.': 'They come with the henhouse.',
  'No hay puesto sin gallinas. Andan sueltas de día, picoteando bichos y semillas alrededor de la casa, y a la tarde se meten solas en el gallinero: saben la hora mejor que uno.':
    'There is no homestead without hens. They roam free by day, pecking at bugs and seeds around the house, and in the evening they go into the henhouse on their own: they know the time better than you do.',

  // ---------------------------------------------------------------- la cocina de a dos
  'Guiso de papas y habas': 'Potato and broad bean stew',
  'Tortilla de papas': 'Potato omelette',
  'Torta frita': 'Torta frita',
  'Dos papas y dos puñados de habas, al fuego.': 'Two potatoes and two handfuls of broad beans, over the fire.',
  'Dos huevos del gallinero y dos papas.': 'Two eggs from the henhouse and two potatoes.',
  'Harina del almacén y un huevo.': 'Flour from the store and an egg.',
  'Lo que hay en la huerta, todo junto en una olla y a esperar. Es la comida de los días de lluvia: rinde, calienta y se come de a poco, con pan si hay.':
    'Whatever the garden has, all in one pot, and then you wait. It is rainy-day food: it goes a long way, it warms you and you eat it slowly, with bread if there is any.',
  'Las papas en rodajas finas, primero en la grasa y después con el huevo batido encima. La vuelta con el plato es lo difícil: sale o no sale, y si no sale igual se come.':
    'Potatoes in thin slices, first in the fat and then with the beaten egg on top. Flipping it with the plate is the hard part: it works or it doesn\'t, and if it doesn\'t you eat it anyway.',
  'La de los días de lluvia en toda la Patagonia: masa de harina estirada, con un agujero en el medio, frita en grasa bien caliente. Se come con mate, y si llueve, más.':
    'The rainy-day food all over Patagonia: flour dough rolled out, with a hole in the middle, fried in very hot fat. It goes with mate, and more so when it rains.',
  'Un kilo de harina': 'A kilo of flour',
  'Harina de trigo en bolsa de papel, de la que sube con el tren desde el valle.': 'Wheat flour in a paper bag, the kind that comes up on the train from the valley.',
  'Harina de trigo en bolsa de papel. Alcanza para cuatro tortas fritas.': 'Wheat flour in a paper bag. Enough for four tortas fritas.',
  'Cuatro tortas fritas, con un huevo cada una.': 'Four tortas fritas, with an egg each.',
  'Elegí con el número o con un clic · Escape para salir': 'Pick with the number or a click · Escape to leave',

  // ---------------------------------------------------------------- el telar
  'Telar de palos': 'Post loom',
  'Un telar criollo de cuatro palos, con la urdimbre tendida y el peine colgado. Con la lana de la majada se teje la manta y ponchos para la feria (E).':
    'A four-post criollo loom, with the warp strung and the reed hanging. With the flock\'s wool you weave the blanket, and ponchos for the fair (E).',
  'Tejer una manta (4 vellones)': 'Weave a blanket (4 fleeces)',
  'Tejer un poncho (3 vellones)': 'Weave a poncho (3 fleeces)',
  'Telar: hacen falta 3 vellones para un poncho (tenés {0})': 'Loom: a poncho needs 3 fleeces (you have {0})',
  'Tejiste una manta': 'You wove a blanket',
  'Tejiste un poncho': 'You wove a poncho',
  'Ahora podés dormir en cualquier lado, sin fuego (T)': 'Now you can sleep anywhere, without a fire (T)',
  'Llevás {0}. En la feria de la estación los cambian bien': 'You have {0}. They trade well at the station fair',
  'No alcanza la lana': 'Not enough wool',
  'Hacen falta 3 vellones para un poncho. La majada está en el galpón': 'A poncho needs 3 fleeces. The flock is at the Shearing Shed',
  'Poncho tejido': 'Woven poncho',
  'del telar': 'from the loom',
  'Armá un telar (O → Trabajo) y tejé con tres vellones.': 'Build a loom (O → Work) and weave with three fleeces.',
  'Un rectángulo de lana con una abertura para la cabeza, y sin embargo abriga como nada: corta el viento, aguanta la llovizna y de noche es manta. Cada tejedora tiene su guarda, y por la guarda se sabe de dónde es.':
    'A rectangle of wool with an opening for the head, and yet nothing keeps you warmer: it stops the wind, sheds the drizzle and at night it is a blanket. Every weaver has her own border pattern, and the pattern tells you where she is from.',
  'Tejí una manta en el telar. Las manos saben antes que uno.': 'I wove a blanket at the loom. The hands know before you do.',
  'Tejí un poncho en el telar. Las manos saben antes que uno.': 'I wove a poncho at the loom. The hands know before you do.',
  'Estuve en el telar: {0} tejidos.': 'I was at the loom: {0} pieces woven.',

  // ---------------------------------------------------------------- la feria
  'La feria de la estación': 'The station fair',
  'Feria de la estación': 'Station fair',
  'Puestos junto al andén, hasta las seis. Cada cambio, una vez por feria.': 'Stalls by the platform, until six. Each trade, once per fair.',
  'ya cambiado': 'already traded',
  'se puede cambiar': 'can trade',
  'falta juntar': 'not enough yet',
  'Ese ya lo cambiaste': 'You already made that trade',
  'Vuelve en la próxima feria': 'It comes back at the next fair',
  'Cambiaste en la feria': 'You traded at the fair',
  'Hoy hay feria en la estación': 'There\'s a fair at the station today',
  'Junto al andén de la Estación del Valle, hasta las seis de la tarde': 'By the Valley Station platform, until six in the evening',
  'Ver la feria': 'Browse the fair',
  'cada cinco días': 'every five days',
  'Cada cinco días, de nueve a seis, junto al andén de la Estación del Valle.': 'Every five days, from nine to six, by the Valley Station platform.',
  'Los días de feria bajan del tren quinteros, leñeros y almaceneros de los pueblos de la línea y arman sus puestos junto al andén. Se cambia lo que sobra por lo que falta: la moneda es lo que cada uno produce.':
    'On fair days market gardeners, woodcutters and shopkeepers from the towns along the line get off the train and set up their stalls by the platform. You trade what you have spare for what you need: the currency is whatever each one produces.',
  'Día de feria: hice {0} cambios junto al andén.': 'Fair day: I made {0} trades by the platform.',

  // ---------------------------------------------------------------- rastrear con el perro
  'Pedirle al perro que rastree': 'Ask the dog to track',
  'Dejar el rastro': 'Call off the trail',
  'El perro olfatea y vuelve': 'The dog sniffs around and comes back',
  'No hay rastros frescos por acá. Probá más adentro del bosque o en la estepa': 'No fresh tracks around here. Try deeper in the forest or out on the steppe',
  'El perro tomó un rastro': 'The dog picked up a trail',
  'Seguilo: te espera si te quedás atrás. E de nuevo mirándolo para dejarlo': 'Follow it: it waits if you fall behind. E again while looking at it to call it off',
  'El perro lo encontró': 'The dog found it',
  'Se perdió el rastro': 'The trail went cold',
  'El animal se fue lejos. El perro vuelve con vos': 'The animal went far off. The dog comes back to you',
  'El rastro se enfrió': 'The trail went stale',
  'Ya no huele a nada. El perro vuelve con vos': 'There is nothing left to smell. The dog comes back to you',
  'Dejaste el rastro': 'You called off the trail',
  'El perro vuelve con vos': 'The dog comes back to you',
  'Seguir un rastro': 'Following a trail',
  'con el perro': 'with the dog',
  'Mirá al perro de cerca y apretá E.': 'Look at the dog up close and press E.',
  'El perro lee el piso como uno lee una carta: por dónde pasó alguien, hace cuánto y si iba apurado. Con paciencia te lleva hasta el pudú escondido en la quila o la liebre agachada entre los coirones.':
    'The dog reads the ground the way you read a letter: who passed by, how long ago and whether they were in a hurry. With patience it leads you to the pudú hiding in the bamboo or the hare crouched among the tussocks.',
  'Seguimos {0} rastros con el perro.': 'The dog and I followed {0} trails.',

  // ---------------------------------------------------------------- visitas
  'Una visita a la tarde': 'An afternoon visit',
  'los vecinos se turnan': 'the neighbours take turns',
  'Armá una mesa de campo con dos asientos alrededor y esperá una tarde.': 'Set up a field table with two seats around it and wait for an afternoon.',
  'En el campo nadie avisa que viene: se ve la mesa puesta, se ve el humo, y se pasa. Se toma algo, se cuenta cómo anda el lago o la majada, y nunca se llega con las manos vacías.':
    'Out in the country nobody announces a visit: you see the table set, you see the smoke, and you drop in. You have a drink, you tell how the lake or the flock is doing, and you never arrive empty-handed.',
  'Buenas, vecino. ¿Se puede? Vi la mesa puesta.': 'Evening, neighbour. May I? I saw the table set.',
  'Bueno, me vuelvo antes de que oscurezca. Gracias por la mesa.': 'Well, I\'ll head back before it gets dark. Thanks for the table.',
  'Te espera en tu mesa hasta que caiga la noche': 'Waiting at your table until nightfall',
  'Viene caminando hacia tu mesa': 'Walking over to your table',
  'Pasaba con la majada y vi la mesa puesta. Uno ve una mesa con bancos y ya sabe que ahí se puede parar.': 'I was passing with the flock and saw the table set. You see a table with benches and you know you can stop there.',
  'Te traje yerba, que la de uno siempre se acaba el día que menos pensás.': 'I brought you yerba, since yours always runs out the day you least expect.',
  'Esta casa ya tiene olor a casa. Eso no lo da la madera: lo da el que vive.': 'This place already smells like a home. The wood doesn\'t do that: whoever lives in it does.',
  'Tomá, para el mate. No me digas que no.': 'Here, for the mate. Don\'t tell me no.',
  'Hoy el lago estaba de vidrio y no picaba nada. Me dije: voy a ver cómo le va al vecino.': 'The lake was like glass today and nothing was biting. I said to myself: let\'s see how the neighbour is doing.',
  'Te dejé unos troncos secos de la orilla. Para la estufa, que las noches se ponen bravas.': 'I left you some dry logs from the shore. For the stove, the nights are getting rough.',
  'Desde el agua se ve el humo de tu casa. Da gusto saber que hay alguien del otro lado.': 'From the water you can see the smoke from your house. It\'s good to know someone is on the other side.',
  'Los troncos los junté a la mañana. Ya están secos.': 'I gathered the logs this morning. They\'re already dry.',
  'Estaba haciendo el recorrido y dije: paso a saludar. ¡Qué linda te quedó la mesa!': 'I was doing my rounds and thought I\'d stop by. Your table turned out lovely!',
  'Te traje semillas de habas del vivero del parque. Se dan bien en esta tierra.': 'I brought you broad bean seeds from the park nursery. They do well in this soil.',
  'Vi rastros de huemul cerca del arroyo. Si los ves, no te acerques mucho: son pocos y se asustan.': 'I saw huemul tracks near the stream. If you see them, don\'t get too close: there are few of them and they scare easily.',
  'Las semillas son de las que guardamos para repartir. Plantalas en otoño.': 'The seeds are from the ones we keep to hand out. Plant them in autumn.',
  'Cerré un rato el almacén. Si alguien necesita algo, que espere: también una tiene derecho a visitar.': 'I closed the store for a while. If anyone needs something, they can wait: a woman is entitled to visit too.',
  'Te traje harina. Con un huevo y un fuego, torta frita. No hay nada más fácil.': 'I brought you flour. With an egg and a fire, torta frita. Nothing easier.',
  'Mirá lo que es esta mesa. Cuando éramos chicos, en una mesa así comíamos doce.': 'Look at this table. When we were kids, twelve of us ate at a table like this.',
  'La harina es de la buena, de la que viene en el tren de los jueves.': 'The flour is the good kind, the one that comes on the Thursday train.',
  'Don Ramón te dejó un kilo de yerba': 'Don Ramón left you a kilo of yerba',
  'Nicanor te dejó cuatro troncos secos': 'Nicanor left you four dry logs',
  'Josefina te dejó semillas de habas': 'Josefina left you broad bean seeds',
  'Ercilia te dejó un kilo de harina': 'Ercilia left you a kilo of flour',
  '{0} vino a visitarte': '{0} came to visit you',
  'Vino {0} a la tarde. Nos sentamos a la mesa y el tiempo pasó sin que nadie lo mirara.': '{0} came by in the afternoon. We sat at the table and time went by without anyone watching it.',

  // ---------------------------------------------------------------- pedidos de fotos
  'Esta foto sirve para una carta': 'This photo is the one a letter asked for',
  'Lo que dejaron por la foto': 'What they left for the photo',
  'Te piden una foto: {0}': 'They ask you for a photo: {0}',

  // ---------------------------------------------------------------- órdenes y cimiento
  'Echar cimiento de piedra': 'Lay a stone footing',
  'Zanja y piedras al pie de la empalizada o el portón más cercano: el excavador ya no pasa por debajo.': 'A trench and stones at the foot of the nearest palisade or gate: the digger can no longer get underneath.',
  'Acercate a una empalizada o portón de madera sin cimiento': 'Get close to a wooden palisade or gate without a footing',
  'acercate a una empalizada o portón de madera sin cimiento': 'get close to a wooden palisade or gate without a footing',
  'Empalizada de troncos: con cimiento': 'Log palisade: stone footing laid',
  'Empalizada reforzada: con cimiento': 'Reinforced palisade: stone footing laid',
  'Portón de empalizada: con cimiento': 'Palisade gate: stone footing laid',
  'Por abajo ya no pasan. Los pozos que ya estén abiertos hay que taparlos igual': 'Nothing gets under it now. Holes that are already open still need filling',

  // ---------------------------------------------------------------- carpeta sincronizada
  'Carpeta sincronizada:': 'Synced folder:',
  'Carpeta sincronizada': 'Synced folder',
  'ninguna': 'none',
  'Elegí una carpeta de OneDrive, Dropbox o Google Drive: la partida se copia sola ahí, y en tu otra computadora el juego te ofrece la más nueva.':
    'Pick a OneDrive, Dropbox or Google Drive folder: your game is copied there automatically, and on your other computer the game offers you the newest one.',
  'Elegir carpeta…': 'Choose folder…',
  'Cambiar carpeta…': 'Change folder…',
  'Dejar de usarla': 'Stop using it',
  'La partida se copia sola en {0}': 'Your game is copied automatically to {0}',
  'La carpeta sincronizada tiene una partida más nueva': 'The synced folder has a newer game',
  'La dejó tu otra computadora: no la piso. Cerrá y volvé a abrir el juego para elegir con cuál seguir': 'Your other computer left it there: it will not be overwritten. Close and reopen the game to choose which one to keep playing',
  'La partida ya no se copia. Lo que quedó en la carpeta sigue ahí': 'Your game is no longer copied. What is already in the folder stays there',
};

// ---------------------------------------------------------------- lo que se arma por combinación
const may = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const min = (s) => s.charAt(0).toLowerCase() + s.slice(1);

// las cosas, como las nombra la feria y la cocina
const COSA_EN = {
  habas: 'broad beans', papas: 'potatoes', huevos: 'eggs', frutillas: 'strawberries', vellones: 'fleeces', ponchos: 'ponchos',
  tablas: 'planks', piedras: 'stones', troncos: 'logs', 'cebadas de yerba': 'rounds of yerba', 'medidas de harina': 'measures of flour',
  'papas para semilla': 'seed potatoes', 'semillas de habas': 'broad bean seeds', 'la mosca atada a mano': 'the hand-tied fly', 'el farol de kerosene': 'the kerosene lantern',
  'un poncho': 'a poncho', 'un huevo': 'an egg', 'un puñado de habas': 'a handful of broad beans', 'una papa': 'a potato', 'una frutilla': 'a strawberry',
  'un vellón': 'a fleece', 'una tabla': 'a plank', 'una piedra': 'a stone', 'un tronco': 'a log',
  // la cocina
  'yerba del almacén': 'yerba from the store', 'piñones': 'piñones', 'frutos de calafate': 'calafate berries', 'papas de tu cantero': 'potatoes from your bed',
  'habas de tu cantero': 'broad beans from your bed', 'huevos del gallinero': 'eggs from the henhouse', 'huevo del gallinero': 'egg from the henhouse',
  'medida de harina del almacén': 'measure of flour from the store', 'papa de tu cantero': 'potato from your bed', 'piñón': 'piñón', 'frutilla': 'strawberry',
  'fruto de calafate': 'calafate berry',
  // 2.3: la miel de la colmena y las truchas del ahumadero (las recetas se arman acá abajo)
  'frascos de miel': 'jars of honey', 'frasco de miel': 'jar of honey', 'truchas ahumadas': 'smoked trout', 'trucha ahumada': 'smoked trout',
};
// "4 habas y 3 papas" → "4 broad beans and 3 potatoes"
function listaEn(texto) {
  return texto.split(/, | y /).map((parte) => {
    const m = /^(\d+) (.+)$/.exec(parte);
    if (m) return `${m[1]} ${COSA_EN[m[2]] || m[2]}`;
    return COSA_EN[parte] || parte;
  }).join(' and ').replace(/ and (?=.* and )/g, ', ');
}
const FERIANTES_EN = {
  'Un carpintero de Esquel': 'A carpenter from Esquel', 'El que arregla la vía': 'The man who mends the track', 'Un leñero del cerro': 'A woodcutter from the hills',
  'Una quintera de El Bolsón': 'A market gardener from El Bolsón', 'El almacenero de Jacobacci': 'The shopkeeper from Jacobacci', 'El panadero de la estación': 'The station baker',
  'Un aserradero de Trevelin': 'A sawmill from Trevelin', 'Un pircador': 'A dry-stone waller', 'Un chacarero': 'A smallholder', 'Un pescador de mosca': 'A fly fisherman',
  'Un farolero retirado': 'A retired lamplighter', 'La cocinera del tren': 'The train cook',
};
for (const o of OFERTAS) {
  const en = FERIANTES_EN[o.texto];
  if (!en) continue;
  const x = textoOferta(o);
  L[o.texto] = en;
  L[x.pide] = listaEn(x.pide);
  L[x.da] = listaEn(x.da);
  L[`da ${x.da} por ${x.pide}`] = `gives ${listaEn(x.da)} for ${listaEn(x.pide)}`;
  L[`Fui a la feria de la estación y cambié con ${min(o.texto)}.`] = `I went to the station fair and traded with ${min(en)}.`;
}
for (const rc of RECETAS_FUEGO) L[textoPide(rc)] = listaEn(textoPide(rc));
L[`Se puede hacer algo con ${RECETAS_FUEGO.slice(1, 5).map((x) => textoPide(x)).join('; ')}`] =
  `You can make something with ${RECETAS_FUEGO.slice(1, 5).map((x) => listaEn(textoPide(x))).join('; ')}`;
L['Guiso de papas y habas'] = 'Potato and broad bean stew';

const ANIMAL_EN = { pudu: 'a pudú', huemul: 'a huemul', zorro: 'a fox', guanaco: 'a guanaco', liebre: 'a hare' };
for (const tipo of RASTREABLES) {
  L[`Es ${nombreRastro(tipo)}. Acercate despacio`] = `It's ${ANIMAL_EN[tipo]}. Approach slowly`;
  L[`El perro tomó un rastro y me llevó hasta ${nombreRastro(tipo)}.`] = `The dog picked up a trail and led me to ${ANIMAL_EN[tipo]}.`;
}
void VISITANTES;

// las cartas que piden fotos: remitente, párrafos, la carta entera y lo que dice Ercilia
const PEDIDOS_EN = {
  'c-vuelta': ['Your sister, from Buenos Aires', null, 'A photo of the lake for your sister. It\'ll look lovely on the fridge. I\'ll pay the postage, don\'t argue.'],
  'c-revista': ['Patagonia Viva magazine, from Buenos Aires', [
    'Dear reader: we heard that huemules can still be seen in your valley. We are putting together a special issue on the southern deer, which is endangered and which almost nobody has seen.',
    'If you manage a photo of a huemul in the low light of morning or evening, send it on the train. We have left the postage paid and a small fee at the store.',
  ], 'The magazine paid in yerba: two kilos. Here, it\'s yours.'],
  'c-almanaque': ['The branch line office', [
    'Dear passenger: we are preparing next year\'s branch line calendar, with photos taken by the passengers themselves.',
    'If you send us a photo of the narrow-gauge train under way, puffing smoke, we will print it with your name. As thanks we have left some old sleepers at the store: good timber, the kind you can\'t get anymore.',
  ], 'The railway people left ten planks of old sleeper. Take them, they\'re filling half my storeroom.'],
  'c-amalia': ['Doña Amalia, weaver from Ingeniero Jacobacci', [
    'Señora Ercilia: the wool they sent me from the valley came out beautiful. I wove three blankets and they are all spoken for already.',
    'I ask one more thing, out of an old woman\'s curiosity: a photo of the shed where they sheared, with the windmill. My father worked in one just like it and I want to see if it looks the same. To whoever takes it, I\'m sending a poncho from my loom.',
  ], 'Amalia sent you a poncho from her loom. Look at the border: it\'s from Jacobacci, you can tell right away.'],
  'c-condores': ['A naturalist from Bariloche', [
    'Dear sir or madam: we are now counting condors at their roosts along the mountains, and we need photos of birds in flight to tell them apart by their wing feathers.',
    'If you can photograph one soaring, send it. For your trouble I am leaving some Andean seed potatoes at the store, from the ones we keep in the seed bank.',
  ], 'The naturalist left seed potatoes, the Andean kind. He says they do best in cold ground.'],
};
const FOTO_EN = { 'f-atardecer': 'Sunset from the dock', 'f-huemul': 'Huemul in low light', 'f-tren': 'La trochita steaming', 'f-galpon': 'Wool and wind', 'f-condor': 'A condor soaring' };
const FOTO_ES = { 'f-atardecer': 'Atardecer desde el muelle', 'f-huemul': 'El huemul con poca luz', 'f-tren': 'La trochita echando humo', 'f-galpon': 'Lana y viento', 'f-condor': 'Un cóndor planeando' };
for (const c of PEDIDOS) {
  const en = PEDIDOS_EN[c.id];
  if (!en) continue;
  const [de, parrafos, gracias] = en;
  const deEs = dePara(c), deEn = min(de);
  if (parrafos) {
    L[c.de] = de;
    c.texto.forEach((p, i) => { if (parrafos[i]) L[p] = parrafos[i]; });
    L[c.texto.join(' ')] = parrafos.join(' ');
    L[`De ${deEs}. La tiene Ercilia en el almacén`] = `From ${deEn}. Ercilia has it at the store`;
    L[`Llegó carta para vos con el tren. Es de ${deEs}. Tomá, leela tranquilo.`] = `A letter came for you on the train. It's from ${deEn}. Here, take your time with it.`;
  }
  const [pregunta, respuesta] = partesDeEnvio(c);
  L[pregunta] = `Is this the photo for ${deEn}? Give it here, it goes out on tomorrow's train.`;
  L[respuesta] = gracias;
  L[`La de ${deEs}. Dásela a Ercilia para que la mande con el tren`] = `The one for ${deEn}. Give it to Ercilia so she sends it on the train`;
  L[`Le di a Ercilia la foto para ${deEs}. Sale mañana con el tren.`] = `I gave Ercilia the photo for ${deEn}. It goes out on tomorrow's train.`;
  L[`Te piden una foto: ${FOTO_ES[c.foto]}`] = `They ask you for a photo: ${FOTO_EN[c.foto]}`;
}

// las órdenes: el aviso y lo que contestan
const ORDEN_EN = { reparar: 'fix whatever is broken', base: 'stay at the base', seguime: 'come with me', porton: 'guard the gate' };
const RESPUESTA_EN = {
  ramon: { reparar: 'Leave it, I\'ll keep patching things up.', seguime: 'Let\'s go. If anything breaks on the way, I\'ll fix it.', porton: 'I\'ll stand at the gate. They won\'t get through there.' },
  ema: { base: 'I\'ll stay here, from the middle I can see everything.', seguime: 'I\'ll be right behind you. You set the pace.', porton: 'I\'ll cover the gate. Let them show their faces.' },
};
for (const [k, lista] of Object.entries(ORDENES)) {
  const nombre = k === 'ramon' ? 'Don Ramón' : 'Josefina';
  for (const o of lista) {
    L[`${nombre}: ${NOMBRE_ORDEN[o].toLowerCase()}`] = `${nombre}: ${ORDEN_EN[o]}`;
    L[`“${RESPUESTAS[k][o]}”`] = `“${RESPUESTA_EN[k][o]}”`;
  }
}
void may;

export const EN_N = L;
