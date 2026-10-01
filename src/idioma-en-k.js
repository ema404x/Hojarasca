// Tanda K: lo nuevo de la 2.0. Las veinte mejoras —diez del Relax, diez del Desafío—
// traen textos de cuaderno, de guía, de encargos y, sobre todo, pedazos: rumbos,
// distancias, fases de la luna. Desde la 2.0 el traductor también traduce lo que cae
// en el hueco de un molde, así que «Se oye {0}, {1}, hacia el {2}.» sale entero en
// inglés si cada pedazo está acá.
export const EN_K = {
  // ---- los pedazos: rumbos, distancias, estaciones en minúscula, fases
  'norte': 'north', 'noreste': 'northeast', 'este': 'east', 'sureste': 'southeast',
  'sur': 'south', 'suroeste': 'southwest', 'oeste': 'west', 'noroeste': 'northwest',
  'detrás tuyo': 'behind you',
  'encima': 'right on you', 'cerca': 'close', 'muy cerca': 'very close', 'lejos': 'far off', 'muy lejos': 'far away',
  'verano': 'summer', 'otoño': 'autumn', 'invierno': 'winter',
  'luna nueva': 'new moon', 'luna creciente': 'waxing crescent', 'cuarto creciente': 'first quarter',
  'gibosa creciente': 'waxing gibbous', 'luna llena': 'full moon', 'gibosa menguante': 'waning gibbous',
  'cuarto menguante': 'last quarter', 'luna menguante': 'waning crescent',
  'Día {0}, {1} · {2} · {3}': 'Day {0}, {1} · {2} · {3}',
  'Luna nueva: noche cerrada, se ve la Vía Láctea.': 'New moon: a black night, and the Milky Way shows.',
  'Luna llena: se ve el camino sin linterna.': 'Full moon: you can see the path without a flashlight.',

  // ---- 1 y 2. esperar y escuchar
  'Esperar': 'Waiting',
  'Los animales tímidos no se persiguen: se esperan. Quedate quieto —mejor sentado o agachado— y al rato dejan de tenerte en cuenta. El pudú y el huemul se acercan solos a mirar.':
    "You don't chase shy animals: you wait for them. Stay still —sitting or crouching is better— and after a while they stop paying you any mind. The pudú and the huemul come closer on their own to look.",
  'Escuchar': 'Listening',
  'El chucao se anota por el canto, no por verlo. Agachate (C) y quedate quieto: el bosque baja, el oído llega más lejos y te dice de qué lado canta lo que todavía no anotaste.':
    "The chucao is noted by its song, not by sight. Crouch (C) and stay still: the forest quiets down, your hearing reaches further and tells you which way something you haven't noted yet is singing.",
  'C + quieto': 'C + still',
  'escuchar con atención': 'listen closely',
  '{0} se acerca': '{0} is coming closer',
  'Un animal': 'An animal',
  'Un huemul': 'A huemul',
  'Quedate quieto: todavía no te vio': "Stay still: it hasn't seen you yet",
  'El bosque ya no te tiene en cuenta.': 'The forest no longer minds you.',
  'Se oye {0}, {1}, hacia el {2}.': 'You hear {0}, {1}, to the {2}.',
  'un chucao': 'a chucao', 'un golpeteo doble': 'a double knock', 'un concón': 'a rufous-legged owl', 'algo': 'something',
  'Escuchás… nada que no tengas anotado.': "You listen… nothing you haven't noted already.",

  // ---- 3. el perro como guía
  'El perro': 'The dog',
  'Huele más lejos que vos. Cuando encuentra un animal que todavía no anotaste, va hacia ahí con la nariz en el rastro, y si te quedás atrás te espera. Seguilo: cuando está cerca, se queda duro señalando.':
    "He smells further than you do. When he finds an animal you haven't noted yet, he heads there with his nose on the trail, and if you fall behind he waits. Follow him: when he's close, he freezes and points.",
  'El perro encontró un rastro': 'The dog found a trail',
  'Seguilo: te lleva hasta algo que no anotaste': "Follow him: he'll take you to something you haven't noted",

  // ---- 4. encargos de temporada
  'Lo que prende en verano': 'What takes root in summer',
  'En verano los renovales prenden mejor que nunca: hay luz y el suelo todavía tiene agua de la nieve. Plantá tres más donde el bosque se abrió. Los que planté yo el año pasado ya me llegan a la rodilla.':
    'In summer saplings take root better than ever: there is light and the ground still holds water from the snow. Plant three more where the forest opened up. The ones I planted last year already reach my knee.',
  'Plantar tres renovales más (B).': 'Plant three more saplings (B).',
  'Tres más. Dentro de veinte años alguien va a caminar a la sombra de eso y no va a saber que fuiste vos. Así tiene que ser.':
    "Three more. In twenty years someone will walk in their shade and won't know it was you. That's how it should be.",
  '6 ramitas secas': '6 dry twigs',
  '4 ramitas secas': '4 dry twigs',
  'El verano de las marrones': 'The summer of the brown trout',
  'Con el calor las truchas grandes suben a comer a la orilla, a la tardecita. Sacá tres más y devolvelas. Ya sé que sabés: esto es para que no te olvides.':
    "With the heat the big trout come up to feed by the shore, in the late afternoon. Catch three more and let them go. I know you know how: this is so you don't forget.",
  'Pescar y devolver tres peces más.': 'Catch and release three more fish.',
  'Tres más al agua. El lago te va a devolver el favor, vas a ver.': "Three more back in the water. The lake will return the favor, you'll see.",
  '4 tablas': '4 planks',
  '6 tablas': '6 planks',
  'La leña del otoño': 'Autumn firewood',
  'Se viene el frío. El que no junta leña en otoño la junta en invierno, con la nieve hasta la rodilla. Tumbá dos árboles de los que sobran, y acordate de plantar después.':
    "The cold is coming. Whoever doesn't gather wood in autumn gathers it in winter, knee-deep in snow. Fell two of the trees there are too many of, and remember to plant afterwards.",
  'Talar dos árboles más (H).': 'Fell two more trees (H).',
  'Con eso pasás el invierno. Y si plantaste, el monte ni se entera.': "That'll get you through the winter. And if you planted, the woods won't even notice.",
  '6 piedras': '6 stones',
  'Las lengas coloradas': 'The red lengas',
  'Dos semanas dura esto, ni una más. Necesito fotos de las lengas coloradas para el registro del año: sacá dos, de donde te parezca que se ve mejor.':
    'This lasts two weeks, not one more. I need photos of the red lengas for this year\'s record: take two, from wherever you think it looks best.',
  'Sacar dos fotos más en otoño (P).': 'Take two more photos in autumn (P).',
  'Esa va al registro. Dentro de diez años alguien va a comparar y va a saber cómo estaba el bosque hoy.':
    "That one goes in the record. In ten years someone will compare and know what the forest looked like today.",
  'La vuelta en la nieve': 'The loop in the snow',
  'En invierno la vuelta es otra: la vía abierta entre la nieve, el lago negro de un lado y la salamandra prendida en el coche. Dala entera una vez, que es cuando más vale la pena.':
    "In winter the loop is something else: the track cut through the snow, the black lake on one side and the stove lit in the carriage. Ride it all the way once; that's when it's most worth it.",
  'Dar la vuelta completa en la trochita.': 'Ride the full loop on la trochita.',
  '¿Viste? Con nieve el recorrido cambia todo. Y las huellas se ven desde la ventanilla.': 'See? With snow the whole ride changes. And you can see the tracks from the window.',
  '4 troncos': '4 logs',
  'El lago negro': 'The black lake',
  'En invierno las truchas bajan hondo y esperan. Casi nadie sale, así que casi nadie las saca. Sacá dos, con paciencia, y me contás cómo fue.':
    'In winter the trout go deep and wait. Hardly anyone goes out, so hardly anyone catches them. Catch two, patiently, and tell me how it went.',
  'Pescar y devolver dos peces en invierno.': 'Catch and release two fish in winter.',
  'Dos en invierno. Eso no lo hace cualquiera: el agua te congela las manos antes que el pique.': "Two in winter. Not everyone can do that: the water freezes your hands before the bite comes.",

  // ---- 5. la huerta
  'La huerta': 'The vegetable patch',
  'En los planos (O → Exterior) está el cantero. Sembrás con E las frutillas o los calafates que juntaste, lo regás una vez por día —la lluvia riega sola— y en un día y medio o dos y medio cosechás cuatro o cinco. Si te olvidás de regar, no se seca: espera.':
    "The planter is in the blueprints (O → Outdoors). Sow the strawberries or calafates you gathered with E, water it once a day —rain waters it for you— and in a day and a half or two and a half you harvest four or five. If you forget to water it, it doesn't dry up: it waits.",
  'Cantero de la huerta': 'Garden planter',
  'Un cajón bajo de tablas lleno de tierra negra del mallín. Ahí sembrás las frutillas y los calafates que juntaste (E), los regás, y a los días cosechás más de lo que pusiste.':
    'A low plank box full of black soil from the wet meadow. You sow the strawberries and calafates you gathered there (E), water them, and a few days later harvest more than you put in.',
  'frutillas': 'strawberries', 'calafates': 'calafates', 'una frutilla': 'a strawberry', 'un calafate': 'a calafate',
  'Sembrar {0}': 'Sow {0}',
  'Cosechar {0}': 'Harvest {0}',
  'Regar: las {0} se quedaron sin agua': 'Water: the {0} ran out of water',
  'Las {0} crecen: faltan unas {1} horas': 'The {0} are growing: about {1} hours to go',
  'La huerta: sembrás con frutillas o calafates que juntes': 'Vegetable patch: sow it with strawberries or calafates you gather',
  'Sembraste {0}': 'You sowed {0}',
  'Con {0} que juntaste. Regala una vez por día, o esperá la lluvia': 'With {0} you gathered. Water it once a day, or wait for the rain',
  'Regaste la huerta': 'You watered the patch',
  'Las {0} tienen agua para un día': 'The {0} have water for a day',
  'Cosechaste {0} {1}': 'You harvested {0} {1}',
  'De tu huerta: sembraste una': 'From your patch: you sowed one',
  'No tenés qué sembrar': 'You have nothing to sow',
  'Juntá frutillas o calafates en el bosque': 'Gather strawberries or calafates in the forest',
  'Las {0} están creciendo': 'The {0} are growing',
  'Faltan unas {0} horas. Tienen agua para {1} más': 'About {0} hours to go. They have water for {1} more',
  'Coseché {0} de la huerta. Tienen otro gusto.': 'I harvested {0} from the patch. They taste different.',

  // ---- 6. la escarcha
  'Amaneció con escarcha. El pasto crujía al pisarlo.': 'Frost at dawn. The grass crunched underfoot.',
  'Helada a la mañana: todo blanco hasta que pegó el sol.': 'A morning frost: everything white until the sun hit it.',

  // ---- 9. el cielo
  'Luna llena': 'Full moon',
  'plenilunio': 'plenilune',
  'La luna cambia de noche en noche. Esperá a que esté entera y mirala un rato.': 'The moon changes from night to night. Wait until it is full and look at it for a while.',
  'En el hemisferio sur la luna no miente: cuando dibuja una C está creciendo, y cuando dibuja una D está menguando. En el norte es al revés, y por eso allá le dicen mentirosa. Con luna llena se camina el bosque sin linterna, pero las estrellas débiles desaparecen.':
    "In the southern hemisphere the moon doesn't lie: when it draws a C it is growing (creciente), and when it draws a D it is shrinking (decreciente). In the north it's the other way round, which is why there they call it a liar. Under a full moon you can walk the forest without a flashlight, but the faint stars disappear.",
  'Lluvia de estrellas': 'Meteor shower',
  'Gemínidas': 'Geminids',
  'Algunas noches de verano llueven estrellas. Mirá hacia el norte, a cielo abierto.': 'Some summer nights it rains stars. Look north, under open sky.',
  'Cada diciembre la Tierra cruza el polvo que dejó el asteroide Faetón, y los granos se queman al entrar en el aire: en el sur cae en pleno verano. Desde la Patagonia las estrellas fugaces salen de muy bajo, del lado norte. Las mejores horas son después de medianoche, lejos de toda luz.':
    'Every December the Earth crosses the dust left by the asteroid Phaethon, and the grains burn up as they enter the air: in the south it falls in the middle of summer. From Patagonia the shooting stars come from very low, on the northern side. The best hours are after midnight, far from any light.',
  'Esta noche llueven estrellas': 'Stars are falling tonight',
  'Mirá hacia el norte, lejos del fuego y sin techo': 'Look north, away from the fire and with no roof overhead',
  'Llovieron estrellas. Conté {0} y después perdí la cuenta.': 'It rained stars. I counted {0} and then lost count.',
  'Vi pasar una estrella fugaz.': 'I saw a shooting star go by.',

  // ---- 10. la lámina
  'Guardar como lámina': 'Save as a plate',
  'Lámina guardada': 'Plate saved',
  'Valle de Hojarasca · día {0} · {1} · {2}': 'Hojarasca Valley · day {0} · {1} · {2}',
  'Valle de Hojarasca · día {0} · {1}': 'Hojarasca Valley · day {0} · {1}',
  'Del álbum': 'From the album',
  'Lo que anoté': 'What I noted',
  'Todavía no hay fotos en el álbum.': 'No photos in the album yet.',
  'Los desafíos de fotos se pegan acá.': 'The photo challenges get pasted here.',
  'Todavía no anotaste plantas ni bichos. Acercate a algo y apretá E.': "You haven't noted any plants or creatures yet. Walk up to something and press E.",
  'día {0}': 'day {0}',
  'CUADERNO DE CAMPO': 'FIELD NOTEBOOK',

  // ---- Desafío 1 a 10
  'Sonidos escritos': 'Written sounds',
  'Con dirección': 'With direction',
  'En el Desafío, lo que se oye de noche y de dónde viene: «[gruñido lejos · noroeste]».': 'In Challenge mode, what you hear at night and where it comes from: «[growl far off · northwest]».',
  'Vibración del mando': 'Gamepad vibration',
  'chillido': 'shriek', 'gruñido': 'growl', 'rugido': 'roar', 'llamado': 'call', 'respiración': 'breathing',
  'latido bajo la tierra': 'heartbeat under the ground', 'algo que cae': 'something falling', 'bramido enorme': 'huge bellow',
  'escupitajo': 'spit', 'ácido que chisporrotea': 'sizzling acid', 'algo que salta': 'something leaping',
  'golpes en la madera': 'blows on the wood', 'derrumbe': 'collapse', 'zumbido de la nave': 'hum of the ship',
  'arañazos en la pared': 'scratching at the wall', 'alguien prueba la puerta': 'someone tries the door',
  'el perro gruñe': 'the dog growls', 'el perro ladra': 'the dog barks', 'pasos rápidos': 'quick footsteps',
  'una antorcha se apaga': 'a torch goes out', 'disparo de plasma': 'plasma shot',
  'Tantean las paredes': "They're feeling the walls",
  'Buscan por dónde entrar. Lo que rompan, arreglalo de día': "They're looking for a way in. Whatever they break, fix it by day",
  'Noche sin luces': 'Night without lights',
  'Algo anda apagando las antorchas': 'Something is putting out the torches',
  'Se apagan las luces': 'The lights go out',
  'Algo las ahoga sin que se vea. Prendelas de nuevo con F': 'Something unseen smothers them. Light them again with F',
  'Bestiario': 'Bestiary',
  'Bestiario (J)': 'Bestiary (J)',
  '{0}: anotado': '{0}: noted',
  '{0}: aprendiste cómo pelea': '{0}: you learned how it fights',
  '{0}: ya conocés su punto débil': '{0}: now you know its weak spot',
  'Visto por primera vez el día {0}': 'First seen on day {0}',
  '{0} abatidos': '{0} killed',
  'completa': 'complete',
  'Abatí {0} de {1} para conocer su punto débil.': 'I have killed {0} of {1} needed to learn its weak spot.',
  'Todavía no abatí ninguno.': "I haven't killed one yet.",
  'Punto débil: {0}': 'Weak spot: {0}',
  'Cada invasor que veas de cerca queda anotado acá. Peleando se aprende cómo se mueve, y al tercero que abatís, dónde es débil.':
    'Every invader you see up close gets noted here. Fighting teaches you how it moves, and with the third one you kill, where it is weak.',
  'Rastreador': 'Tracker', 'Tirador': 'Shooter', 'Bruto': 'Brute', 'Saltador': 'Leaper', 'Escupidor': 'Spitter',
  'Jefe de nido': 'Nest boss', 'Mutado': 'Mutant',
  'Flaco, encorvado, corre en cuatro patas cuando te tiene en la mira.': 'Thin, hunched, it runs on all fours once it has you in its sights.',
  'Caza como los perros cimarrones: si lo mirás, se frena o se esconde; si le das la espalda, carga. No le des la espalda.':
    "It hunts like feral dogs: if you look at it, it stops or hides; if you turn your back, it charges. Don't turn your back on it.",
  'Poca vida y ningún blindaje: la lanza lo baja de dos golpes. El perro lo frena mordiéndole las patas.': 'Little health and no armor: the spear brings it down in two hits. The dog slows it down by biting its legs.',
  'Alto, con un orbe en la mano que se enciende antes de disparar.': 'Tall, with an orb in its hand that lights up before it fires.',
  'Se planta a media distancia y dispara plasma. No tira si hay una pared entre él y vos.': "It plants itself at mid range and fires plasma. It won't shoot if there's a wall between you.",
  'Pegate a una pared o a un tronco y hacelo acercarse. De cerca es lento para apuntar.': "Stick to a wall or a trunk and make it come closer. Up close it's slow to aim.",
  'Enorme, lento, con los ojos color brasa.': 'Huge, slow, with ember-colored eyes.',
  'No le tienen miedo a la luz: van derecho a las antorchas y las apagan. Rompen una empalizada en pocos golpes.': "They're not afraid of light: they go straight for the torches and put them out. They break a palisade in a few blows.",
  'Lento para girar: rodealo. Las estacas y los pozos lo frenan más que a nadie.': 'Slow to turn: circle around it. Stakes and pits slow it more than anything else.',
  'Chico y rapidísimo. Pasa por encima de lo que le pongas adelante.': 'Small and very fast. It gets over whatever you put in front of it.',
  'Salta empalizadas simples de una. Acecha como el rastreador.': 'It clears simple palisades in one jump. It stalks like the tracker.',
  'Casi sin vida. Los muros altos y los portones reforzados no los puede saltar.': "Almost no health. It can't jump high walls or reinforced gates.",
  'Pesado, con una bolsa en el cuello que burbujea.': 'Heavy, with a bubbling sac on its neck.',
  'Escupe ácido en arco por encima de las defensas. El ácido quema las obras donde cae.': 'It spits acid in an arc over the defenses. The acid burns whatever it lands on.',
  'De cerca no puede escupir: tiene que alejarse para apuntar. Encima, es presa fácil.': "It can't spit up close: it has to back off to aim. Right on top of it, it's easy prey.",
  'Cuatro metros, sacos verdes en la espalda.': 'Four meters tall, green sacs on its back.',
  'Se da vuelta despacio y aplasta lo que tenga adelante.': 'It turns slowly and crushes whatever is in front of it.',
  'Los sacos de la espalda: el golpe ahí duele el doble.': 'The sacs on its back: a hit there hurts twice as much.',
  'Uno de los de siempre, pero con las venas encendidas de otro color.': 'One of the usual ones, but with its veins glowing another color.',
  'Salen después del nido. Aguantan más, pegan más fuerte y se curan solos si los dejás respirar.': 'They come out after the nest. They last longer, hit harder and heal on their own if you give them a breather.',
  'No les des tregua: si seguís pegando no llegan a cerrarse las heridas.': "Give them no respite: if you keep hitting, their wounds don't get to close.",
  'De noche': 'At night',
  'Con la linterna (L), los ojos de los invasores devuelven la luz: dos puntos en la oscuridad. Los rastreadores y los saltadores acechan: si los mirás, se frenan o se esconden; si les das la espalda, cargan. El perro gruñe hacia lo que todavía no ves.':
    "With the flashlight (L), the invaders' eyes throw the light back: two dots in the dark. Trackers and leapers stalk: if you look at them, they stop or hide; if you turn your back, they charge. The dog growls toward what you can't see yet.",
  'Encerrarte': 'Shutting yourself in',
  'Si te metés en un refugio, primero tantean: rascan las paredes y prueban la puerta. Después golpean. Lo que rompan, arreglalo de día.':
    'If you hole up in a shelter, they feel around first: they scratch the walls and try the door. Then they start hitting. Whatever they break, fix it by day.',
  'El bestiario': 'The bestiary',
  'En el cuaderno (J), la pestaña Bestiario anota cada invasor que ves de cerca. Peleando se aprende cómo se mueve, y al tercero que abatís, su punto débil.':
    'In the notebook (J), the Bestiary tab records every invader you see up close. Fighting teaches you how it moves, and with the third one you kill, its weak spot.',
  'Cuando cae el nido, la pantalla final te deja elegir cinco noches más contra invasores mutados: más duros, y se curan si los dejás respirar.':
    'When the nest falls, the final screen lets you choose five more nights against mutant invaders: tougher, and they heal if you give them a breather.',
  'Lo que se oye de noche aparece escrito con su dirección: «[gruñido lejos · noroeste]». Se apaga en Ajustes, igual que la vibración del mando.':
    'What you hear at night is written out with its direction: «[growl far off · northwest]». It can be turned off in Settings, like gamepad vibration.',
  'Seguir peleando: las noches después': 'Keep fighting: the nights after',
  'Las noches después': 'The nights after',
  'Algo sobrevivió al nido. {0} noches más: vienen cambiados': 'Something survived the nest. {0} more nights: they come back changed',
  'Noche después {0} de {1}': 'Night after {0} of {1}',
  'Cada vez vienen más cambiados': 'Each time they come back more changed',
  'Se terminaron las noches después': 'The nights after are over',
  'Sobreviviste a lo que quedó del nido. Ahora sí, el valle es tuyo': 'You survived what was left of the nest. Now the valley really is yours',
};
