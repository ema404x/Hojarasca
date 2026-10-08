// Tanda L: lo nuevo de la 2.1. Diez mejoras: grabador, rastros, el tiempo que se ve
// venir, el almanaque y las conservas en el Relax; rescates, excavador, jefes, restos y
// forja en el Desafío. Como en la K, muchos textos llegan armados con moldes: están los
// moldes y también los pedazos que caen en sus huecos (nombres de aves, de huellas,
// de lugares del valle).
export const EN_L = {
  // ---- los pedazos: nombres que caen en huecos
  'el chucao': 'the chucao', 'el carpintero': 'the woodpecker', 'las cachañas': 'the parakeets',
  'el concón': 'the owl', 'las bandurrias': 'the ibises', 'el cauquén': 'the upland goose',
  'los cisnes': 'the swans', 'el martín pescador': 'the kingfisher', 'el picaflor': 'the firecrown',
  'huemul': 'huemul deer', 'pudú': 'pudú deer', 'guanaco': 'guanaco', 'zorro': 'fox', 'liebre': 'hare',
  'al norte': 'to the north', 'al noreste': 'to the northeast', 'al este': 'to the east', 'al sureste': 'to the southeast',
  'al sur': 'to the south', 'al suroeste': 'to the southwest', 'al oeste': 'to the west', 'al noroeste': 'to the northwest',
  'el puesto de Don Ramón': "Don Ramón's puesto", 'la cabaña de Nicanor': "Nicanor's cabin",
  'el almacén de Ercilia': "Ercilia's store", 'la estación de Elsa': "Elsa's station",
  'frasco de dulce de frutilla': 'jar of strawberry jam', 'frascos de dulce de frutilla': 'jars of strawberry jam',
  'un frasco de dulce de frutilla': 'a jar of strawberry jam',
  'bolsita de calafates secos': 'little bag of dried calafate berries', 'bolsitas de calafate seco': 'little bags of dried calafate',
  'atado de llao llao seco': 'bundle of dried llao llao', 'atados de llao llao seco': 'bundles of dried llao llao',
  // el almanaque junta los nombres con «y»: van las combinaciones enteras
  'picaflor rubí': 'green-backed firecrown', 'bandurria austral': 'black-faced ibis', 'cauquén común': 'upland goose',
  'picaflor rubí y bandurria austral': 'green-backed firecrown and black-faced ibis',
  'picaflor rubí y cauquén común': 'green-backed firecrown and upland goose',
  'bandurria austral y cauquén común': 'black-faced ibis and upland goose',
  'picaflor rubí, bandurria austral y cauquén común': 'green-backed firecrown, black-faced ibis and upland goose',

  // ---- 1. el grabador
  'El grabador': 'The recorder',
  'Clic justo después de que cante un ave anotada: la graba. Si no cantó nada, hace sonar lo grabado y contesta la más cercana.':
    'Click right after a bird you have written down sings: it records it. If nothing just sang, it plays back what you recorded and the nearest one answers.',
  'Grabador de mano': 'Handheld recorder',
  'De casete, con parlante chico. Se lo dejó un guardaparque que se jubiló.': 'A cassette one, with a tiny speaker. A ranger left it when they retired.',
  'Un grabador de casete de los que usaban los guardaparques para los censos de aves. Grabás el canto de un ave que ya anotaste y, al hacerlo sonar, la más cercana contesta: algunas se acercan a ver quién anda en su territorio.':
    'A cassette recorder like the ones rangers used for bird counts. You record the song of a bird you have already written down and, when you play it back, the nearest one answers: some come closer to see who is in their territory.',
  'Se cambia por dos frascos de dulce de frutilla y dos plumas.': 'Traded for two jars of strawberry jam and two feathers.',
  'Grabaste {0}': 'You recorded {0}', 'Hacés sonar {0}': 'You play {0}', 'Contesta {0}': 'An answer from {0}',
  '{0}, hacia el {1}': '{0}, to the {1}', '{0}, hacia el {1} · viene a ver': '{0}, to the {1} · coming to look',
  'Clic de nuevo, cuando no cante nada, para hacerlo sonar': 'Click again, when nothing is singing, to play it back',
  'Eso todavía no está en el cuaderno': "That isn't in the notebook yet",
  'Primero anotalo; después se graba': 'Write it down first; then you can record it',
  'El grabador está vacío': 'The recorder is empty',
  'Cuando cante cerca un ave que ya anotaste, clic para grabarla': 'When a bird you have written down sings nearby, click to record it',
  'De día no contesta: es un ave de la noche': "It doesn't answer by day: it's a night bird",
  'No contesta nadie: por acá no anda': 'Nobody answers: it isn\'t around here',
  'Esperá un momento': 'Wait a moment',
  'Tenés su canto en el grabador.': 'You have its song on the recorder.',
  'Grabé {0}. Cuando lo hice sonar, contestaron.': 'I recorded {0}. When I played it back, they answered.',

  // ---- 2. rastros
  'Rastros': 'Tracks', 'Rastreado': 'Tracked',
  'A veces aparece una hilera de huellas cerca tuyo. Parado encima, E las mira: la primera vez se anotan, y siempre te dicen para dónde van. Al final está el animal.':
    'Sometimes a line of tracks shows up near you. Standing on them, E looks at them: the first time they get written down, and they always tell you which way they go. At the end is the animal.',
  'Huellas de huemul': 'Huemul tracks', 'Huellas de pudú': 'Pudú tracks', 'Huellas de guanaco': 'Guanaco tracks',
  'Huellas de zorro': 'Fox tracks', 'Huellas de liebre': 'Hare tracks', 'Huellas de {0}': '{0} tracks',
  'pezuña partida, grande': 'split hoof, large', 'pezuña partida, chiquita': 'split hoof, tiny',
  'dos dedos con almohadilla': 'two toes on a pad', 'almohadilla y cuatro dedos': 'pad and four toes',
  'dos largas adelante, dos cortas atrás': 'two long in front, two short behind',
  'Una hilera de pezuñas grandes en el barro. Acercate y mirala (E).': 'A line of big hoofprints in the mud. Get close and look at it (E).',
  'Pezuñas tan chicas que parecen de cabra. Entre la caña colihue.': 'Hooves so small they look like a goat\'s. Among the colihue cane.',
  'En la estepa, pisadas anchas y separadas.': 'On the steppe, wide prints set far apart.',
  'Una almohadilla y cuatro dedos, en línea recta.': 'A pad and four toes, in a straight line.',
  'Grupos de cuatro marcas: dos largas y dos chicas.': 'Groups of four marks: two long and two small.',
  'Dos mitades en punta, de unos ocho centímetros, bien hundidas: es un animal pesado. Cuando va tranquilo pone la pata de atrás casi encima de la de adelante. Seguirlas es la mejor forma de ver uno.':
    'Two pointed halves, about eight centimeters, pressed deep: a heavy animal. When it walks calmly it sets the hind foot almost on top of the front one. Following them is the best way to see one.',
  'Del tamaño de una moneda grande, con pasos muy cortos y muy juntos. El pudú no se aleja del sotobosque: si el rastro sale a un claro, enseguida vuelve a meterse.':
    'The size of a large coin, with very short, tight steps. The pudú never strays from the undergrowth: if the trail comes out into a clearing, it soon ducks back in.',
  'El guanaco no tiene pezuña dura: apoya dos dedos sobre una almohadilla blanda, y por eso casi no daña el suelo. Las huellas son anchas y el paso largo.':
    'The guanaco has no hard hoof: it stands on two toes over a soft pad, so it barely harms the ground. The prints are wide and the stride long.',
  'Cuatro dedos con las uñas marcadas y una almohadilla atrás. El zorro camina poniendo una pata delante de la otra, así que el rastro sale casi como una línea de puntos.':
    'Four toes with the claws showing and a pad behind. The fox walks placing one foot in front of the other, so the trail comes out almost like a dotted line.',
  'La liebre salta: las patas de atrás, largas, caen por delante de las de adelante. Por eso las dos marcas largas quedan adelante, al revés de lo que uno pensaría.':
    'The hare hops: the long hind feet land ahead of the front ones. That is why the two long marks end up in front, the opposite of what you would think.',
  'Van hacia el {0}: seguilas': 'They head {0}: follow them',
  'Rastro de {0}: ¿para dónde va?': 'A {0} trail: which way does it go?',
  'Mirar las huellas': 'Look at the tracks',
  'Seguí un rastro de {0} un buen rato.': 'I followed a {0} trail for a good while.',

  // ---- 3. el tiempo que se ve venir
  'El tiempo': 'The weather',
  'La lluvia entra del oeste: las nubes se ven cargar sobre la cordillera un par de horas antes, y los vecinos lo anuncian cuando los saludás.':
    'Rain comes in from the west: you can see the clouds build over the mountains a couple of hours ahead, and the neighbors call it when you greet them.',
  'Se viene agua del lado de la cordillera. Guardá la leña.': 'Rain coming from the mountains. Put the firewood away.',
  'Mirá cómo se tapó el cerro. A la tarde se larga, acordate de lo que te digo.': 'Look how the hill got covered. It will pour this afternoon, mark my words.',
  'Esas nubes sobre los cerros no son de paso: va a llover.': "Those clouds over the hills aren't passing through: it's going to rain.",
  'Hay un frente entrando por el oeste. En un par de horas llueve.': "There's a front coming in from the west. Rain in a couple of hours.",
  'Las truchas están saltando como locas: se viene agua.': 'The trout are jumping like crazy: rain is coming.',
  'El lago se puso quieto y oscuro. Ésa es lluvia, en un rato.': "The lake went still and dark. That's rain, in a little while.",
  'El humo de la máquina se va para abajo. Llueve, seguro.': "The engine smoke is sinking. It'll rain, for sure.",
  'Hoy la trochita va a volver mojada.': 'La trochita is coming back wet today.',
  'Traé la ropa del tendal, que se viene.': "Bring the washing in off the line, it's coming.",
  'Me duelen las rodillas. Va a llover, ya vas a ver.': "My knees ache. It's going to rain, you'll see.",
  'Se está cerrando del oeste. No creo que llueva, pero el sol se va.': "It's closing in from the west. I don't think it'll rain, but the sun is going.",
  'Viene un nublado. Buena luz para sacar fotos, sin sombras duras.': 'Clouds coming. Good light for photos, no hard shadows.',
  'Se nubla. Para pescar, mejor: la trucha se anima.': 'Clouding over. Better for fishing: the trout perk up.',
  'Se viene un día gris, de esos para la estufa.': 'A gray day coming, the kind for sitting by the stove.',
  'Se pone gris. Nada que preocupe.': 'Getting gray. Nothing to worry about.',
  'El frente ya pasa. En un rato sale el sol.': 'The front is passing. The sun will be out soon.',
  'Esto para enseguida: mirá el claro que se abre sobre el lago.': "This'll stop soon: look at the gap opening over the lake.",
  'Se está limpiando. Mañana la vía amanece seca.': "It's clearing. The tracks will be dry by morning.",
  'Ya afloja. Detrás del cerro se ve el celeste.': 'Letting up already. Blue sky behind the hill.',
  'Ya para, ya para. Esperá un ratito adentro.': "It's stopping, it's stopping. Wait inside a little.",

  // ---- 4. lo que llega y lo que se va
  'Cuándo: {0}': 'When: {0}',
  'Todo el año.': 'All year.', 'Todo el año, de noche.': 'All year, at night.',
  'De primavera a otoño. En invierno se va al norte, a zonas más templadas.': 'Spring to autumn. In winter it goes north, to milder places.',
  'De primavera a otoño, en los pastizales. En invierno migra al norte.': 'Spring to autumn, in the grasslands. In winter it migrates north.',
  'Al anochecer, de verano a otoño. En invierno hiberna.': 'At dusk, summer to autumn. In winter it hibernates.',
  'Al mediodía, con sol. En invierno pasa bajo tierra.': 'At midday, in sunshine. It spends winter underground.',
  'Con calor y sin lluvia. En invierno no se ve.': "In warm, dry weather. You don't see it in winter.",
  'Se oye con calor. En invierno el panal calla.': 'You hear it when it is warm. In winter the hive goes quiet.',
  'Todo el año. En otoño es la brama: los machos se oyen de lejos, al atardecer.': 'All year. Autumn is the rut: the stags can be heard from far away at dusk.',
  'Se fueron al norte': 'They went north', 'Ya no se ven: {0}. Vuelven con el calor.': "Gone for now: {0}. They'll be back with the warm weather.",
  'Volvieron': "They're back", 'Otra vez en el valle: {0}.': 'Back in the valley: {0}.',

  // ---- 5. conservas
  'Conservas': 'Preserves',
  'Dulce de frutilla en frasco': 'Strawberry jam in a jar', 'Dulce de frutilla': 'Strawberry jam',
  'Calafates secos': 'Dried calafate', 'Llao llao seco': 'Dried llao llao',
  'Lo de verano, en invierno': "Summer's food, in winter",
  'Cuatro frutillas al fuego, cuando ya sabés hacerlas al rescoldo.': 'Four strawberries on the fire, once you know how to do them in the embers.',
  'Se cocina despacio, con la tapa del frasco hervida aparte. Bien cerrado dura hasta el invierno, que es cuando más se agradece. En el almacén lo toman como si fuera plata.':
    'It cooks slowly, with the jar lid boiled separately. Sealed tight it lasts until winter, which is when you are most grateful for it. At the store they take it like money.',
  'Cinco calafates colgados en un tendal, medio día de sol.': 'Five calafate berries hung on a drying rack, half a day of sun.',
  'Al sol se arrugan y se vuelven dulces como pasas. Se comen con el mate o se guardan para el invierno en una bolsita de tela.':
    'In the sun they wrinkle and turn sweet as raisins. You eat them with mate or keep them for winter in a little cloth bag.',
  'Tres llao llao colgados en un tendal, medio día de sol.': 'Three llao llao hung on a drying rack, half a day of sun.',
  'Llao llao seco en la olla. El bosque de otoño, en invierno.': 'Dried llao llao in the pot. The autumn forest, in winter.',
  'Tres, colgados en un tendal, se secan en medio día de sol.': 'Three, hung on a drying rack, dry in half a day of sun.',
  'Unos calafates secos con el mate. Dicen que el que come calafate vuelve.': 'Some dried calafate with the mate. They say whoever eats calafate comes back.',
  'Abrí un frasco de dulce de frutilla. Sabe a enero.': 'I opened a jar of strawberry jam. It tastes like January.',
  'A la noche abrí una de las conservas del verano.': 'At night I opened one of the summer preserves.',
  'Se guarda para el invierno, o se cambia en el almacén': 'Keep it for winter, or trade it at the store',
  'Para el invierno, o para cambiar en el almacén.': 'For winter, or to trade at the store.',
  'Un frasco de dulce de frutilla': 'A jar of strawberry jam',
  'Guardado para el invierno. Tenés {0}': 'Put away for winter. You have {0}',
  'Colgaste a secar': 'You hung it up to dry',
  '{0} calafates: medio día de sol, y la lluvia lo frena': '{0} calafate berries: half a day of sun, and rain slows it down',
  '{0} llao llao: medio día de sol, y la lluvia lo frena': '{0} llao llao: half a day of sun, and rain slows it down',
  'Colgar a secar ({0} calafates)': 'Hang to dry ({0} calafate berries)', 'Colgar a secar ({0} llao llao)': 'Hang to dry ({0} llao llao)',
  'Descolgar: {0}': 'Take down: {0}', 'Descolgaste: {0}': 'You took down: {0}',
  'Secándose: faltan unas {0} horas': 'Drying: about {0} hours to go',
  'Todavía se está secando': 'Still drying', 'Faltan unas {0} horas': 'About {0} hours to go',
  'No tenés qué colgar': 'Nothing to hang up',
  'Cinco calafates, o tres llao llao ya anotados': 'Five calafate berries, or three llao llao already written down',
  'Juntar llao llao': 'Pick llao llao',
  'Botas de goma': 'Rubber boots', 'Altas y negras, de las de pescador de río.': "Tall and black, the river angler's kind.",
  'Altas, de goma negra, de las que usan los pescadores de río. Con ellas cruzás el arroyo sin chapotear: los animales de la orilla casi no te oyen.':
    'Tall, black rubber, the kind river anglers use. With them you cross the stream without splashing: the animals on the bank barely hear you.',
  'Cruzás el agua sin chapotear: los animales de la orilla casi no te oyen.': 'You cross water without splashing: the animals on the bank barely hear you.',
  'Se cambian por calafates secos y llao llao seco.': 'Traded for dried calafate and dried llao llao.',
  'Conseguido': 'Obtained',

  // ---- 6. rescates
  'Rescates': 'Rescues',
  '¡Atacan {0}!': "They're attacking {0}!",
  'Está {0}. Si vas a defenderlo, {1} no se lo va a olvidar': "It's {0}. If you go defend it, {1} won't forget it",
  '{0} te agradece': '{0} thanks you',
  'Y se viene a tu base a darte una mano.': "And they're coming to your base to lend a hand.",
  'Te dejó ocho flechas.': 'Left you eight arrows.', 'Te dio dos emplastos.': 'Gave you two poultices.',
  'Destrozaron {0}': '{0} was wrecked',
  '{0} no va a querer hablarte por unos días': "{0} won't want to talk to you for a few days",
  'Anoche me destrozaron el puesto y vos no viniste. Dejame tranquilo un par de días.': "Last night they wrecked my puesto and you didn't come. Leave me alone for a couple of days.",
  'No tengo ganas de hablar. Anoche la cabaña casi se viene abajo.': "I don't feel like talking. Last night the cabin nearly came down.",
  'Hoy no atiendo. Anoche nadie vino a ayudar.': "I'm not serving today. Nobody came to help last night.",
  'La estación quedó hecha un desastre. Hoy no tengo cabeza para charlar.': "The station is a wreck. I'm in no mood to chat today.",
  'Hoy no tengo ganas de hablar.': "I don't feel like talking today.",

  // ---- 7. el excavador
  'El excavador': 'The digger', 'Excavador': 'Digger',
  'Si tiene una empalizada adelante, no la rompe: se mete bajo tierra y sale adentro, cerca tuyo. Se lo oye cavar y se ve el polvo.':
    'If there is a palisade ahead, it does not break it: it goes underground and comes out inside, near you. You can hear it dig and see the dust.',
  'Bajo, encorvado, color de tierra, con brazos cortos como palas.': 'Low, hunched, earth-colored, with short arms like shovels.',
  'Donde hay losa de piedra no puede asomar. Y cuando sale queda aturdido un momento: ahí.': "It can't surface where there's a stone slab. And when it comes out it's stunned for a moment: that's your chance.",
  'Algo cava bajo la tierra': 'Something is digging underground',
  'Va a salir adentro. Donde hay losa de piedra no puede asomar': "It'll come out inside. It can't surface where there's a stone slab",
  'El excavador chocó con la losa': 'The digger hit the slab',
  'No pudo atravesar la piedra: salió más atrás': "It couldn't get through the stone: it came out further back",
  'Losa de piedra': 'Stone slab',
  'Lajas grandes asentadas en el suelo, bien juntas. No frenan a nadie por arriba, pero por abajo no pasa el excavador: donde hay losa, no puede asomar.':
    "Big flagstones set tight into the ground. They don't stop anyone above, but the digger can't get through below: where there's a slab, it can't surface.",
  'algo cava bajo la tierra': 'something digging underground', 'la tierra se abre': 'the ground splits open',

  // ---- 8. los jefes
  'No se lo ve. Con la linterna encendida (L), el haz lo descubre': "You can't see it. With the flashlight on (L), the beam gives it away",
  'Se queda lejos y tira piedras a las defensas. Salí a buscarlo': 'It stays far off and throws rocks at the defenses. Go out after it',
  'una piedra que cae': 'a falling rock',

  // ---- 9. los restos
  'Los restos': 'The wreckage',
  'Puede haber tecnología útil, al fondo del casco: cuidado con las placas del piso y con lo que duerme adentro':
    'There may be useful tech at the back of the hull: watch the floor plates and whatever sleeps inside',
  'Puede decirte dónde está el nido, al fondo del casco: cuidado con las placas del piso y con lo que duerme adentro':
    'It may tell you where the nest is, at the back of the hull: watch the floor plates and whatever sleeps inside',

  // ---- 10. la forja
  'La forja': 'The forge', 
  'Lanza de hielo': 'Ice spear', 'Flechas de rayo': 'Lightning arrows', 'Honda de empuje': 'Force sling',
  'El golpe congela: frena en seco a rastreadores y saltadores. Contra los grandes casi no sirve.': 'The blow freezes: it stops trackers and leapers dead. Against the big ones it barely works.',
  'La piedra empuja y derriba: el tirador y el escupidor quedan en el suelo sin poder apuntar.': "The stone shoves and knocks down: the shooter and the spitter end up on the ground, unable to aim.",
  'rastreadores y saltadores: los frena en seco': 'trackers and leapers: stops them dead',
  'los grupos: el rayo salta a los que están cerca': 'groups: the bolt jumps to those nearby',
  'tiradores y escupidores: los derriba y no pueden apuntar': "shooters and spitters: knocks them down so they can't aim",
  'algo se congela': 'something freezes', 'descarga eléctrica': 'electric discharge', 'un rayo que salta': 'a jumping bolt',

  // ---- la guía (el extractor descarta lo que tiene paréntesis: van a mano)
  'Se cambia en el almacén por dulce de frutilla y plumas. Clic justo después de que cante un ave anotada: la graba. Si no cantó nada, hace sonar lo grabado y contesta la más cercana; el carpintero y las cachañas se acercan a ver.':
    'You trade for it at the store with strawberry jam and feathers. Click right after a bird you have written down sings: it records it. If nothing just sang, it plays back the recording and the nearest one answers; the woodpecker and the parakeets come closer to look.',
  'Con las frutillas al rescoldo ya aprendidas, cuatro frutillas al fuego hacen un frasco de dulce. Cinco calafates o tres llao llao se secan en un tendal (E). Se cambian en el almacén, y en invierno se abren junto al fuego.':
    'Once you know strawberries in the embers, four strawberries on the fire make a jar of jam. Five calafate berries or three llao llao dry on a drying rack (E). You trade them at the store, and in winter you open them by the fire.',
  'Algunas noches atacan el lugar de un vecino: el puesto, la cabaña, el almacén o la estación. Si vas y aguanta, te lo agradece; si cae, el vecino no te habla por unos días.':
    "Some nights they attack a neighbor's place: the puesto, the cabin, the store or the station. If you go and it holds, they thank you; if it falls, that neighbor won't talk to you for a few days.",
  'Desde la noche 7. No rompe la empalizada: cava por abajo y sale cerca tuyo. Se oye cavar y se ve el polvo. Donde hay losa de piedra (O → Defensa) no puede asomar.':
    "From night 7. It doesn't break the palisade: it digs underneath and comes up near you. You hear it dig and see the dust. It can't surface where there's a stone slab (O → Defense).",
  'En el taller (K), pestaña Forja: lanza de hielo (frena a los rápidos), flechas de rayo (para los grupos) y honda de empuje (derriba a los que tiran de lejos).':
    'At the workshop (K), Forge tab: ice spear (stops the fast ones), lightning arrows (for groups) and force sling (knocks down the ones shooting from afar).',
  'Grabás cantos de aves anotadas; al hacerlos sonar, la más cercana contesta.': 'You record the songs of birds you have written down; when you play them, the nearest one answers.',
  'De primavera a otoño. En otoño pasan altas las bandadas que migran al norte; en invierno no queda ninguno.':
    "Spring to autumn. In autumn the flocks fly over high on their way north; in winter there are none left.",
  'Secos pierden el agua y ganan gusto. Los pueblos del sur los comían frescos en primavera; secos, se guardan para cuando el bosque ya no da nada.':
    'Dried, they lose their water and gain flavor. The peoples of the south ate them fresh in spring; dried, they keep for when the forest has nothing left to give.',
  'cambiadas en el almacén': 'traded at the store', 'llao llao': 'llao llao', 'cantos rodados': 'river stones',

  // ---- sueltos que quedaban de antes
  'quien te lo pidió': 'whoever asked you',
  'Un alero de piedra con la pared pintada: decenas de manos en negativo y una tropilla de guanacos. Se pintaban soplando pigmento sobre la mano apoyada, con un hueso hueco, y por eso casi todas son manos izquierdas: la derecha sostenía el tubo. Las de la Cueva de las Manos, en el cañadón del río Pinturas, en Santa Cruz, tienen más de 9.000 años y son Patrimonio de la Humanidad. Abajo quedan las piedras de un fogón.':
    'A rock overhang with a painted wall: dozens of hands in negative and a small herd of guanacos. They were painted by blowing pigment over a hand pressed to the rock, through a hollow bone, which is why almost all are left hands: the right one held the tube. Those at the Cueva de las Manos, in the Pinturas river canyon in Santa Cruz, are more than 9,000 years old and a World Heritage Site. Below lie the stones of an old fire ring.',
  'Galpón de esquila con sus tablas, la prensa de lana y los fardos apilados. Afuera, los corrales de palo a pique, la manga que lleva a la rampa, una pirca de piedra de un corral más viejo y el molino australiano que llena el tanque. Entre 1880 y 1950 la lana movió la Patagonia: las comparsas de esquiladores recorrían las estancias de campo en campo, y en un galpón como este trabajaban veinte personas de sol a sol.':
    'A shearing shed with its boards, the wool press and the stacked bales. Outside, the post-and-rail pens, the race leading to the ramp, a dry-stone wall from an older pen and the windmill that fills the tank. Between 1880 and 1950 wool drove Patagonia: shearing gangs went from estancia to estancia, and in a shed like this twenty people worked from dawn to dusk.',
  'Base de piedra en ocho caras, torre encalada y capucha de madera. Se entra por la puerta y se sube por veinticuatro peldaños pegados a la pared hasta el entrepiso, donde están las dos muelas: la de abajo fija y la de arriba girando, movida por el árbol central y la rueda dentada que baja de las aspas. Arriba, la tolva por donde se echa el grano; abajo, las bolsas donde cae la harina. Un molino así muele entre cincuenta y cien kilos por hora con buen viento.':
    'An eight-sided stone base, a whitewashed tower and a wooden cap. You go in through the door and climb twenty-four steps set into the wall up to the mezzanine, where the two millstones are: the lower one fixed and the upper one turning, driven by the central shaft and the gear wheel coming down from the sails. Above, the hopper where the grain goes in; below, the sacks where the flour falls. A mill like this grinds fifty to a hundred kilos an hour in a good wind.',
};
