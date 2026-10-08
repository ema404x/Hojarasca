// Tanda P: lo nuevo de la 2.3. Cinco cosas del Relax (colmena, ahumadero, vivero, leña
// del invierno, fogón de cuentos) y cinco del Desafío (capullos, trochita varada,
// volador, zanja de fuego, código de partida). Van los textos enteros, los moldes con
// huecos y los pedazos que caen en ellos. Mismos términos que el resto: la trochita,
// puesto, workbench, supply pile.
import { CUENTOS } from './cuentos.js';
export const EN_P = {
  // ---------------------------------------------------------------- pedazos
  'ciprés': 'cypress', 'ñire': 'ñire', 'coihue': 'coihue', 'lenga': 'lenga',

  // ---------------------------------------------------------------- las obras nuevas
  'Colmena': 'Beehive',
  'Un cajón de abejas sobre dos piedras, con techito y piquera. Los canteros que tiene a menos de 18 m rinden uno más por cosecha, y cada tanto hay miel (E). En invierno las abejas no salen.':
    'A bee box on two stones, with a little roof and an entrance slot. Garden beds within 18 m yield one more per harvest, and every so often there is honey (E). In winter the bees stay in.',
  'Ahumadero': 'Smokehouse',
  'Un horno bajo de piedra con una casilla de tablas arriba, donde se cuelgan las truchas. Con un ahumadero, de lo que pescás te quedás con dos truchas por día; con un tronco de leña, en medio día salen ahumadas (E).':
    'A low stone firebox with a plank cabinet on top, where the trout hang. With a smokehouse you keep two trout a day from what you catch; with one log of firewood, half a day later they come out smoked (E).',
  'Vivero de almácigos': 'Seedling nursery',
  'Un cajón bajo con seis almácigos y una media sombra de tablas. Las semillas que juntás en otoño de coihues, lengas, ñires y cipreses, y los piñones, germinan en tres días y salen plantines (E), que se plantan con B ya crecidos a la mitad.':
    'A low box with six seed trays under a slatted shade. Seeds you gather in autumn from coihues, lengas, ñires and cypresses, and pehuén seeds too, sprout in three days into seedlings (E), which you plant with B already half grown.',
  'Leñera techada': 'Covered woodshed',
  'Un techito de tablas sobre cuatro postes, abierto al frente, para la leña. Lo que guardás acá (E) queda seco: en invierno cada fuego pide un tronco seco, y la leña que llevás encima se moja con la lluvia.':
    'A plank roof on four posts, open at the front, for firewood. What you store here (E) stays dry: in winter every fire needs a dry log, and the wood you carry gets wet in the rain.',
  'Ballesta al cielo': 'Sky crossbow',
  'Zanja de fuego': 'Fire trench',
  'Una zanja poco profunda delante del paso. Se carga con dos troncos (E) y se prende (E otra vez) cuando llegan: arde un minuto y quema al que la cruza. Con viento, el fuego puede escaparse al pasto; con lluvia, no prende.':
    'A shallow trench across the way in. Load it with two logs (E) and light it (E again) when they come: it burns for a minute and scorches whoever crosses. With wind the fire can escape into the grass; in rain it will not light.',

  // ---------------------------------------------------------------- el cuaderno
  'Cuentos del fogón': 'Fireside tales',
  'Miel': 'Honey', 'de tu colmena': 'from your beehive',
  'Armá una colmena (O → Trabajo) cerca de la huerta y esperá unos días de sol.': 'Build a beehive (O → Work) near the garden and wait a few sunny days.',
  'Las abejas salen con sol y calor, y vuelven cargadas de todo lo que florece: el notro, el amancay, la rosa mosqueta, lo que sembraste. Por eso la miel de cada valle sabe distinta. En invierno no salen: se quedan apretadas adentro, calentándose entre ellas.':
    'Bees go out in sun and warmth and come back loaded with whatever is in flower: the notro, the amancay, the sweetbriar, what you planted. That is why each valley\'s honey tastes different. In winter they stay in, packed tight, keeping each other warm.',
  'Trucha para ahumar': 'Trout for smoking', 'dos por día': 'two a day',
  'Con un ahumadero armado, de lo que pescás te quedás con dos truchas por día.': 'With a smokehouse built, you keep two trout a day from what you catch.',
  'Las truchas no son de acá: llegaron en tren, en tachos con hielo, hace más de cien años. Se llevan pocas —el permiso de pesca de la zona pide devolver casi todo—, y las nativas, la perca y el pejerrey, vuelven siempre al agua.':
    'Trout are not from here: they came by train, in cans packed with ice, more than a hundred years ago. Few are kept —the local fishing permit asks you to release almost everything— and the native perch and silverside always go back in the water.',
  'Trucha ahumada': 'Smoked trout', 'del ahumadero': 'from the smokehouse',
  'Colgá truchas en el ahumadero con un tronco de leña y esperá medio día.': 'Hang trout in the smokehouse with one log of firewood and wait half a day.',
  'Abierta, con sal gruesa, y colgada horas sobre un fuego chico de leña que casi no hace llama: lo que la cura es el humo. Así se guardaba el pescado en los puestos del sur, para cuando el lago se ponía bravo.':
    'Split open, rubbed with coarse salt and hung for hours over a small wood fire that barely flames: the smoke is what cures it. That is how fish was kept in the southern puestos, for when the lake turned rough.',
  'Sopaipillas con miel': 'Sopaipillas with honey', 'sopaipillas con miel': 'sopaipillas with honey',
  'Harina del almacén y un frasco de miel, al fuego.': 'Flour from the store and a jar of honey, over the fire.',
  'Masa de harina estirada, cortada en rombos y frita hasta que se infla. Con un chorro de miel encima no duran nada en el plato.': 'Rolled-out dough cut into diamonds and fried until it puffs. With honey drizzled on top they vanish from the plate.',
  'Trucha ahumada con papas': 'Smoked trout with potatoes', 'trucha ahumada con papas': 'smoked trout with potatoes',
  'Una trucha ahumada y dos papas del cantero.': 'One smoked trout and two potatoes from the bed.',
  'La trucha desmenuzada sobre papas hervidas, con un poco de grasa. Comida de invierno, de las que se hacen con lo que se guardó en verano.': 'Flaked trout over boiled potatoes, with a little fat. Winter food, the kind made from what was put away in summer.',
  'frascos de miel': 'jars of honey', 'frasco de miel': 'jar of honey', 'truchas ahumadas': 'smoked trout', 'trucha ahumada': 'smoked trout',
  '1 medida de harina del almacén y 1 frasco de miel': '1 measure of flour from the store and 1 jar of honey',
  '1 trucha ahumada y 2 papas de tu cantero': '1 smoked trout and 2 potatoes from your bed',
  'Una cucharada de miel en el mate. El verano entero en un frasco.': 'A spoonful of honey in the mate. The whole summer in a jar.',
  'Trucha ahumada junto al fuego. Afuera nieva y no importa.': 'Smoked trout by the fire. It snows outside and it does not matter.',
  // semillas y plantines
  'Semilla de coihue': 'Coihue seed', 'Semilla de lenga': 'Lenga seed', 'Semilla de ñire': 'Ñire seed', 'Semilla de ciprés': 'Cypress seed',
  'En otoño, junto a un coihue grande, E la junta.': 'In autumn, next to a big coihue, E gathers it.',
  'En otoño, junto a un lenga grande, E la junta.': 'In autumn, next to a big lenga, E gathers it.',
  'En otoño, junto a un ñire grande, E la junta.': 'In autumn, next to a big ñire, E gathers it.',
  'En otoño, junto a un ciprés grande, E la junta.': 'In autumn, next to a big cypress, E gathers it.',
  'Nuececillas diminutas, de a tres dentro de una cúpula con escamas. Un coihue grande larga miles, y casi ninguna llega a árbol: por eso en el vivero se cuida cada una.':
    'Tiny nutlets, three to a scaly cupule. A big coihue drops thousands and hardly any become trees: that is why in the nursery each one is looked after.',
  'La lenga semilla fuerte cada unos años y flojo los demás: los años buenos el suelo del bosque queda alfombrado. Germina mejor si pasó un invierno bajo la nieve.':
    'Lenga seeds heavily every few years and lightly in between: in the good years the forest floor is carpeted. It sprouts best after a winter under snow.',
  'El ñire crece donde los otros no pueden: en los mallines, en el borde de la estepa, en las laderas quemadas. Por eso es el primero que vuelve después de un incendio.':
    'Ñire grows where the others cannot: in the wet meadows, at the edge of the steppe, on burned slopes. That is why it is the first to come back after a fire.',
  'Conitos chicos que se abren al secarse y sueltan semillas con un ala, para que el viento las lleve. El ciprés crece lento: un plantín de dos palmos puede tener cinco años.':
    'Small cones that open as they dry and release winged seeds for the wind to carry. The cypress grows slowly: a seedling two hands tall can be five years old.',
  'Plantín de coihue': 'Coihue seedling', 'Plantín de lenga': 'Lenga seedling', 'Plantín de ñire': 'Ñire seedling', 'Plantín de ciprés': 'Cypress seedling', 'Plantín de pehuén': 'Monkey puzzle seedling',
  'del vivero': 'from the nursery',
  'Sembrá semillas en el vivero (O → Trabajo) y esperá tres días.': 'Sow seeds in the nursery (O → Work) and wait three days.',
  'Un coihue de dos palmos, con las primeras hojas verdaderas. Plantado en un claro con B, en una semana ya se para solo.': 'A coihue two hands tall, with its first true leaves. Planted in a clearing with B, within a week it stands on its own.',
  'Un lenga de dos palmos, con las primeras hojas verdaderas. Plantado en un claro con B, en una semana ya se para solo.': 'A lenga two hands tall, with its first true leaves. Planted in a clearing with B, within a week it stands on its own.',
  'Un ñire de dos palmos, con las primeras hojas verdaderas. Plantado en un claro con B, en una semana ya se para solo.': 'A ñire two hands tall, with its first true leaves. Planted in a clearing with B, within a week it stands on its own.',
  'Un ciprés de dos palmos, con las primeras hojas verdaderas. Plantado en un claro con B, en una semana ya se para solo.': 'A cypress two hands tall, with its first true leaves. Planted in a clearing with B, within a week it stands on its own.',
  'Un pehuén de dos palmos, con las primeras hojas verdaderas. Plantado en un claro con B, en una semana ya se para solo.': 'A monkey puzzle two hands tall, with its first true leaves. Planted in a clearing with B, within a week it stands on its own.',
  // los cuentos
  'contado al fogón': 'told by the fire',
  'Cuando un vecino venga de visita, prendé un fuego cerca de la mesa y hablale de noche.': 'When a neighbour comes to visit, light a fire near the table and talk to them at night.',
  'La luz mala': 'The evil light',
  'Esto me lo contó mi abuelo, que era arriero, y a él el suyo. En el campo abierto, en noches sin luna, a veces se ve una luz que va y viene, bajita, a la altura de un caballo.':
    'My grandfather told me this, he was a drover, and his grandfather told him. Out on open land, on moonless nights, sometimes you see a light that comes and goes, low, at the height of a horse.',
  'No es un farol ni una estrella. Si la seguís, se aleja; si te quedás quieto, se acerca. Los viejos decían que era un alma que no encontraba el camino, o que marcaba un lugar donde había algo enterrado.':
    'It is not a lantern or a star. If you follow it, it moves away; if you stand still, it comes closer. The old folks said it was a soul that could not find its way, or that it marked a place where something was buried.',
  'Yo la vi una sola vez, volviendo de la veranada. El caballo se plantó y no hubo forma. Esperamos hasta que se fue sola, para el lado del cerro. Al otro día no había nada ahí. Pero el caballo no quiso volver a pasar.':
    'I saw it only once, coming back from the summer pastures. The horse planted its feet and would not budge. We waited until it drifted off on its own, toward the hill. The next day there was nothing there. But the horse never wanted to go that way again.',
  'El cuero del lago': 'The hide in the lake',
  'En los lagos del sur se cuenta del cuero. Dicen que es como un cuero de vaca estirado, con el borde lleno de uñas, que flota bajo el agua quieta.':
    'In the southern lakes they tell of the cuero. They say it is like a stretched cowhide, its edge full of claws, floating just under still water.',
  'Los que lo cuentan dicen que se lleva a los que se meten al agua en los días de calor, en las pozas hondas donde el agua cambia de color. Por eso los chicos no se bañaban solos.':
    'Those who tell it say it takes people who go into the water on hot days, in the deep pools where the water changes colour. That is why children never swam alone.',
  'Yo creo que es una manera de decir que el agua fría y honda no perdona. Pero cuando paso con el bote por una poza oscura, igual remo un poco más rápido.':
    'I think it is a way of saying that deep, cold water does not forgive. But when I row over a dark pool, I still pull a little faster.',
  'El huemul blanco': 'The white huemul',
  'Entre los guardaparques corre una historia que nadie firma. Que en lo más alto del bosque anda un huemul blanco, entero blanco, como si la nieve se hubiera puesto a caminar.':
    'Among the rangers there is a story nobody signs their name to. That high up in the forest walks a white huemul, white all over, as if the snow had started walking.',
  'Dicen que se deja ver sólo por los que andan sin apuro y sin ruido, y que mira un rato largo antes de irse. Y que el año que alguien lo ve, nacen más cervatillos.':
    'They say it only lets itself be seen by those who walk slowly and quietly, and that it looks at you a long while before it goes. And that in the year someone sees it, more fawns are born.',
  'Yo no lo vi. Pero cada vez que cuento huemules en el censo, me fijo dos veces en los que están quietos contra la nieve. Por las dudas.':
    'I have not seen it. But every time I count huemules for the census, I look twice at the ones standing still against the snow. Just in case.',
  'El tren de medianoche': 'The midnight train',
  'Cuando yo era chica, el tren no andaba de noche. Pero mi madre juraba que una noche de invierno oyó el silbato a las doce en punto, largo, como cuando llega a la estación.':
    'When I was a girl the train did not run at night. But my mother swore that one winter night she heard the whistle at twelve on the dot, long, like when it pulls into the station.',
  'Salió con el farol. La vía estaba nevada y no había una huella. Al otro día le contaron que esa misma noche, lejos, en la vía de la meseta, un tren había quedado parado en la nieve con toda la gente adentro, y que a medianoche los sacaron sanos.':
    'She went out with the lantern. The tracks were snowed over and there was not a single footprint. The next day they told her that same night, far away on the plateau line, a train had been stuck in the snow with everyone inside, and at midnight they got them all out safe.',
  'Ella decía que el silbato era el tren avisando que estaban bien. Mi padre decía que era el viento en los cables. Yo no sé. Pero cuando nieva fuerte, a las doce, siempre escucho.':
    'She said the whistle was the train letting them know they were all right. My father said it was the wind in the wires. I do not know. But when it snows hard, at midnight, I always listen.',
  'Lo que asomó en el lago': 'What rose in the lake', 'una noche de luna': 'a moonlit night',
  'Después de oír las historias del lago, una noche clara, desde la orilla. Hay que tener suerte.': 'After hearing the lake stories, on a clear night, from the shore. You need luck.',
  'Un lomo oscuro, largo, que salió del agua quieta, se quedó un momento y se hundió sin hacer ruido. Puede haber sido un tronco que subió con la presión, o un cardumen, o una ola cruzada. Nicanor diría que el lago es hondo y guarda lo suyo.':
    'A long, dark back that rose out of the still water, stayed a moment and sank without a sound. It may have been a log brought up by the pressure, or a school of fish, or a crossing wave. Nicanor would say the lake is deep and keeps its own.',
  'Algo en el lago': 'Something in the lake', 'Eso que asomó una noche de luna, antes de hundirse.': 'That thing that rose one moonlit night, before it sank.',

  // ---------------------------------------------------------------- la mochila
  'De tu colmena. Para las sopaipillas, la feria o el invierno.': 'From your beehive. For sopaipillas, the fair or the winter.',
  'Truchas frescas': 'Fresh trout', 'Para el ahumadero (E), con un tronco de leña.': 'For the smokehouse (E), with a log of firewood.',
  'Truchas ahumadas': 'Smoked trout', 'Aguantan hasta el invierno. Con papas, al fuego.': 'They keep until winter. With potatoes, over the fire.',
  'Semillas de coihue': 'Coihue seeds', 'Semillas de lenga': 'Lenga seeds', 'Semillas de ñire': 'Ñire seeds', 'Semillas de ciprés': 'Cypress seeds',
  'Para el vivero (E): en tres días salen plantines.': 'For the nursery (E): in three days they become seedlings.',
  'Plantines de coihue': 'Coihue seedlings', 'Plantines de lenga': 'Lenga seedlings', 'Plantines de ñire': 'Ñire seedlings', 'Plantines de ciprés': 'Cypress seedlings', 'Plantines de pehuén': 'Monkey puzzle seedlings',
  'Con B, en un claro: ya vienen crecidos a la mitad.': 'With B, in a clearing: they come already half grown.',

  // ---------------------------------------------------------------- colmena
  'La colmena tiene miel': 'The beehive has honey', 'Cuando quieras, la sacás con E': 'Whenever you like, take it with E',
  'Sacaste 1 frasco de miel': 'You took 1 jar of honey', 'Sacaste {0} frascos de miel': 'You took {0} jars of honey',
  'Llevás {0}. Para el fuego, la feria o el invierno': 'You have {0}. For the fire, the fair or the winter',
  'Las abejas no salen en invierno': 'The bees stay in during winter', 'Se quedan apretadas adentro, calentándose entre ellas': 'They stay packed inside, keeping each other warm',
  'Las abejas están trabajando': 'The bees are working', 'Falta miel: más o menos un día de sol': 'No honey yet: about one sunny day to go', 'Falta miel: unos {0} días de sol': 'No honey yet: about {0} sunny days to go',
  'Sacar la miel (1 frasco)': 'Take the honey (1 jar)', 'Sacar la miel ({0} frascos)': 'Take the honey ({0} jars)',
  'La colmena en invierno: las abejas no salen': 'The beehive in winter: the bees stay in', 'Mirar la colmena': 'Look at the beehive',
  'Las abejas se alborotan': 'The bees get stirred up', 'Pasá despacio al lado de la colmena': 'Walk slowly past the beehive',
  'Una más gracias a las abejas. Llevás {0}': 'One more thanks to the bees. You have {0}',

  // ---------------------------------------------------------------- ahumadero
  'Te la quedás para el ahumadero ({0} de {1} hoy)': 'You keep it for the smokehouse ({0} of {1} today)',
  'Las truchas ya están ahumadas': 'The trout are smoked', 'Están en el ahumadero, esperándote': 'They are waiting in the smokehouse',
  'Sacaste 1 trucha ahumada': 'You took 1 smoked trout', 'Sacaste {0} truchas ahumadas': 'You took {0} smoked trout',
  'Llevás {0}. Aguantan hasta el invierno': 'You have {0}. They keep until winter',
  'Colgaste 1 trucha al humo': 'You hung 1 trout in the smoke', 'Colgaste {0} truchas al humo': 'You hung {0} trout in the smoke',
  'En medio día están. El fuego se cuida solo': 'Ready in half a day. The fire tends itself',
  'Se están ahumando': 'They are smoking', 'Falta leña': 'Firewood needed', 'Un tronco por tanda, para el fuego de abajo': 'One log per batch, for the fire underneath',
  'No tenés truchas': 'You have no trout', 'Con el ahumadero, de lo que pescás te quedás con {0} truchas por día': 'With the smokehouse, you keep {0} trout a day from what you catch',
  'Sacar las truchas ahumadas ({0})': 'Take the smoked trout ({0})', 'Ahumando: faltan unas {0} horas': 'Smoking: about {0} hours to go',
  'Colgar 1 trucha al humo': 'Hang 1 trout in the smoke', 'Colgar {0} truchas al humo': 'Hang {0} trout in the smoke',
  'Falta un tronco para el fuego': 'A log is needed for the fire', 'Ahumadero vacío': 'Smokehouse empty',

  // ---------------------------------------------------------------- vivero
  'Sacaste 1 plantín': 'You took 1 seedling', 'Sacaste {0} plantines': 'You took {0} seedlings',
  'Se plantan con B en un claro: ya vienen crecidos a la mitad': 'Plant them with B in a clearing: they come already half grown',
  'Sembraste 1 almácigo': 'You sowed 1 seed tray', 'Sembraste {0} almácigos': 'You sowed {0} seed trays',
  'En {0} días salen los plantines': 'Seedlings in {0} days', 'Están germinando': 'They are sprouting', 'Falta un día': 'One day to go', 'Faltan {0} días': '{0} days to go',
  'No tenés semillas': 'You have no seeds',
  'En otoño, junto a un coihue, una lenga, un ñire o un ciprés grande, E junta semilla. Los piñones también sirven': 'In autumn, next to a big coihue, lenga, ñire or cypress, E gathers seed. Pehuén seeds work too',
  'Sacar 1 plantín': 'Take 1 seedling', 'Sacar {0} plantines': 'Take {0} seedlings', 'Sembrar en el vivero ({0})': 'Sow in the nursery ({0})',
  'Germinando: 1 almácigo': 'Sprouting: 1 seed tray', 'Germinando: {0} almácigos': 'Sprouting: {0} seed trays',
  'Vivero vacío: en otoño, juntá semillas de los árboles grandes': 'Nursery empty: in autumn, gather seeds from the big trees',
  'Semilla de {0}': '{0} seed', 'Llevás {0}. En el vivero germina en {1} días': 'You have {0}. In the nursery it sprouts in {1} days', 'Juntar semilla de {0}': 'Gather {0} seed',
  'Plantaste un plantín': 'You planted a seedling',

  // ---------------------------------------------------------------- leña del invierno
  'Guardaste 1 tronco en la leñera': 'You stored 1 log in the woodshed', 'Guardaste {0} troncos en la leñera': 'You stored {0} logs in the woodshed',
  'Hay {0} secos. En invierno, cada fuego se lleva uno': '{0} dry ones. In winter each fire takes one',
  '1 tronco seco': '1 dry log', '{0} troncos secos': '{0} dry logs', 'La leñera está llena': 'The woodshed is full', 'Traé troncos para guardar': 'Bring logs to store',
  'Guardar leña en la leñera ({0})': 'Store firewood in the woodshed ({0})', 'Leñera: {0} de {1} troncos secos': 'Woodshed: {0} of {1} dry logs',
  'La leña está mojada': 'The firewood is wet', 'Hace humo y no prende. La que guardás en la leñera queda seca': 'It smokes and will not light. What you keep in the woodshed stays dry',
  'En invierno hace falta leña': 'In winter you need firewood', 'Con ramitas solas no alcanza: traé un tronco seco': 'Twigs alone will not do: bring a dry log',
  'Se fue un tronco de leña': 'A log of firewood went on', 'Quedan {0} en la leñera': '{0} left in the woodshed', 'De los que llevabas encima': 'From the ones you were carrying',
  'Dormiste calentito': 'You slept warm', 'El fuego aguantó toda la noche': 'The fire lasted all night',
  'Pasaste frío': 'You spent a cold night',
  'Sin fuego, la noche de invierno se mete en los huesos: vas a andar lento un rato, o hasta que te calientes junto a un fuego': 'Without a fire, a winter night gets into your bones: you will move slowly for a while, or until you warm up by a fire',
  'La manta ayudó, pero no alcanzó': 'The blanket helped, but not enough', 'Te levantás entumecido: un fuego lo arregla': 'You wake up stiff: a fire will fix it',
  'Ya entraste en calor': 'You have warmed up', 'El cuerpo arrancó': 'Your body is going again',

  // ---------------------------------------------------------------- el fogón
  '{0} se queda al fuego': '{0} stays by the fire', 'Hablale: de noche, al fogón, se cuentan otras cosas': 'Talk to them: at night, by the fire, other things get told',
  'Me voy yendo, que se hizo tarde. Gracias por el fuego.': 'I will be heading off, it got late. Thanks for the fire.',
  '¿Viste eso?': 'Did you see that?', 'Algo asomó en el lago. Si tenés la cámara (P), es ahora': 'Something rose in the lake. If you have the camera (P), now is the time',

  // ---------------------------------------------------------------- el diario
  'Saqué un frasco de miel de la colmena. Las abejas ni se enteraron.': 'I took a jar of honey from the hive. The bees did not even notice.',
  'Saqué {0} frascos de miel. Huele a flor de todo el valle.': 'I took {0} jars of honey. It smells like every flower in the valley.',
  'Saqué las truchas del ahumadero. La casa quedó oliendo a humo, y está bien.': 'I took the trout out of the smokehouse. The house smells of smoke, and that is fine.',
  'Afuera helaba. Adentro el fuego duró toda la noche.': 'It was freezing outside. Inside, the fire lasted all night.',
  'Me dormí sin fuego y la helada se metió por todos lados. Mañana, leña.': 'I slept without a fire and the frost got in everywhere. Tomorrow, firewood.',
  'La manta ayudó, pero sin fuego el invierno se siente igual.': 'The blanket helped, but without a fire you still feel the winter.',
  'En el lago asomó algo. Un lomo oscuro, un rato, y se hundió. No sé qué vi.': 'Something rose in the lake. A dark back, for a moment, and then it sank. I do not know what I saw.',
  'Junté los huevos del gallinero, todavía tibios.': 'I gathered the eggs from the henhouse, still warm.',
  'Esquilé una oveja. Se sacudió y se fue a pastar como si nada.': 'I sheared a sheep. It shook itself and went off to graze as if nothing happened.',
  'Esquilé {0} ovejas. Me duelen las manos.': 'I sheared {0} sheep. My hands ache.',

  // ---------------------------------------------------------------- la guía (Relax)
  'La colmena': 'The beehive',
  'O → Trabajo. Los canteros a menos de 18 m rinden uno más por cosecha, y cada unos días de sol hay miel (E). En invierno las abejas no salen. Pasá despacio al lado: corriendo se alborotan.':
    'O → Work. Beds within 18 m yield one more per harvest, and every few sunny days there is honey (E). In winter the bees stay in. Walk past slowly: running stirs them up.',
  'El ahumadero': 'The smokehouse',
  'O → Trabajo. Con un ahumadero, de lo que pescás te quedás con dos truchas por día. Colgalas con un tronco de leña (E): en medio día salen ahumadas.':
    'O → Work. With a smokehouse you keep two trout a day from what you catch. Hang them with a log of firewood (E): half a day later they come out smoked.',
  'El vivero': 'The nursery',
  'O → Trabajo. En otoño, junto a un coihue, una lenga, un ñire o un ciprés grande, E junta semilla. En el vivero germina en tres días; el plantín se planta con B y ya viene crecido a la mitad.':
    'O → Work. In autumn, next to a big coihue, lenga, ñire or cypress, E gathers seed. In the nursery it sprouts in three days; the seedling is planted with B and comes already half grown.',
  'La leña del invierno': 'Winter firewood',
  'En invierno cada fuego pide además un tronco seco. La leñera (O → Trabajo) guarda la leña seca; la que llevás encima se moja con la lluvia. Si dormís sin fuego cerca, amanecés entumecido.':
    'In winter every fire also needs a dry log. The woodshed (O → Work) keeps firewood dry; what you carry gets wet in the rain. If you sleep with no fire nearby, you wake up stiff.',
  'El fogón': 'The fireside',
  'Si un vecino vino de visita y hay un fuego prendido cerca de la mesa, se queda hasta tarde. Hablale de noche: al fogón se cuentan otras cosas.':
    'If a neighbour came to visit and there is a fire lit near the table, they stay late. Talk to them at night: by the fire, other things get told.',

  // ================================================================= Desafío
  // ---------------------------------------------------------------- capullos
  'Está {0}. Quemalo (E, con una ramita) antes de que caiga la noche': 'It is {0}. Burn it (E, with a twig) before night falls',
  'El más cercano, {0}. Quemalos (E, con una ramita) antes de que caiga la noche': 'The nearest one is {0}. Burn them (E, with a twig) before night falls',
  'Mojado no prende': 'Wet, it will not burn', 'Rompelo a golpes: son tres, y el que sale, sale flojo': 'Break it open: three blows, and whatever comes out comes out weak',
  'Te falta una ramita': 'You need a twig', 'Juntá ramitas bajo los árboles, o rompelo a golpes': 'Gather twigs under the trees, or break it open',
  'El que estaba adentro salió flojo: terminalo': 'The one inside came out weak: finish it',

  // ---------------------------------------------------------------- la trochita varada
  '¡La trochita se quedó varada!': 'La trochita is stranded!',
  'Elsa está adentro, {0}, a {1} m de la estación. Si la escoltás, llega': 'Elsa is aboard, {0}, {1} m from the station. If you escort it, it will make it',
  'Rompieron la trochita': 'They wrecked la trochita',
  'Elsa no va a querer hablarte por unos días, y el tren queda parado hasta que amanezca': 'Elsa will not want to talk to you for a few days, and the train stays stopped until dawn',
  'La trochita llegó a la estación': 'La trochita reached the station',
  'La trochita siguió sola con la luz': 'La trochita went on alone at first light',
  'Elsa esperó a que amaneciera. Esta vez no llegó con vos': 'Elsa waited for dawn. This time it did not arrive with you',

  // ---------------------------------------------------------------- el volador
  'volador': 'flyer',
  'Arriba sólo lo alcanzan las flechas, la pistola y la ballesta que apunta al cielo. Cuando baja a apagar una llama, también la lanza.':
    'Up high only arrows, the pistol and the crossbow that aims at the sky can reach it. When it comes down to snuff a flame, so can the spear.',
  'un aleteo': 'wingbeats', 'algo baja en picada': 'something diving', 'una llama se apaga': 'a flame goes out',
  'algo que revienta': 'something bursting', 'algo se quema': 'something burning', 'la zanja prende': 'the trench catches',

  // ---------------------------------------------------------------- la zanja de fuego
  'La zanja está cargada': 'The trench is loaded', 'Echaste leña en la zanja': 'You put wood in the trench',
  'Prendela con E cuando lleguen: arde un minuto': 'Light it with E when they come: it burns for a minute', 'Falta {0} tronco': '{0} more log needed',
  '¡La zanja arde!': 'The trench is burning!', 'Un minuto de fuego. Con viento, cuidado con el pasto': 'A minute of fire. With wind, watch the grass',
  'La leña queda en la zanja: prendela cuando afloje': 'The wood stays in the trench: light it when it lets up',
  'Faltan troncos': 'Logs needed', 'La zanja se carga con {0} troncos': 'The trench is loaded with {0} logs',
  'La zanja ya arde': 'The trench is already burning', 'Quedan {0} segundos': '{0} seconds left',
  'La zanja se apagó': 'The trench burned out', 'Cargala de nuevo con dos troncos': 'Load it again with two logs',
  '¡El fuego se escapó al pasto!': 'The fire got into the grass!', 'Con viento se corre: alejate y cuidá la madera de las defensas': 'With wind it spreads: stay back and look after the wooden defences',
  'La zanja arde ({0} s)': 'The trench is burning ({0} s)', 'Cargar la zanja con leña ({0})': 'Load the trench with wood ({0})',
  'Zanja vacía: hacen falta dos troncos': 'Empty trench: two logs needed', 'Zanja cargada: con esta lluvia no prende': 'Trench loaded: it will not light in this rain',
  'Prender la zanja': 'Light the trench',

  // ---------------------------------------------------------------- el código de partida
  'Código de partida': 'Game code', 'El de esta semana': 'This week\'s', 'Sin código: noches al azar': 'No code: random nights',
  'Esta partida usa {0}: las mismas noches para cualquiera que lo use.': 'This game uses {0}: the same nights for anyone who uses it.',
  'Esta partida no tiene código. Se elige al empezar un Desafío nuevo.': 'This game has no code. You choose one when starting a new Challenge.',
  'Con un código, las noches salen siempre iguales: sirve para comparar con la otra computadora o con amigos.': 'With a code, the nights always come out the same: good for comparing with your other computer or with friends.',
  'Un código es una palabra y un número, como COIHUE-4821.': 'A code is a word and a number, like COIHUE-4821.',
  'Tu mejor con {0}: 1 noche.': 'Your best with {0}: 1 night.', 'Tu mejor con {0}: {1} noches.': 'Your best with {0}: {1} nights.',
  'Con {0}, las mismas noches para cualquiera que lo use.': 'With {0}, the same nights for anyone who uses it.',
  'Código {0}': 'Code {0}', 'Las mismas noches para cualquiera que lo use. Tu récord con este código se guarda aparte': 'The same nights for anyone who uses it. Your record with this code is kept separately',
  'Tu mejor noche con {0}': 'Your best night with {0}', '1 noche resistida con este código': '1 night survived with this code',
  '{0} noches resistidas con este código': '{0} nights survived with this code',

  // ---------------------------------------------------------------- la guía (Desafío)
  'La trochita varada': 'La trochita stranded',
  'La zanja de fuego': 'The fire trench',
  'Defensa nueva (O → Defensa). Se carga con dos troncos (E) y se prende (E) cuando llegan: arde un minuto. Con viento el fuego puede escaparse al pasto y quemar madera; con lluvia no prende.':
    'New defense (O → Defense). Load it with two logs (E) and light it (E) when they come: it burns for a minute. With wind the fire can escape into the grass and burn wood; in rain it will not light.',
  'En la portada del Desafío. Con un código (o el de esta semana), las noches salen siempre iguales: sirve para comparar récords con la otra computadora o con amigos.':
    'On the Challenge title screen. With a code (or this week\'s), the nights always come out the same: good for comparing records with your other computer or with friends.',
};
// La ficha del cuaderno de cada cuento es el cuento entero: se arma con las partes ya
// traducidas, así no se escribe dos veces.
for (const c of CUENTOS) {
  const partes = c.partes.map((p) => EN_P[p]);
  if (partes.every(Boolean)) EN_P[c.partes.join(' ')] = partes.join(' ');
}
