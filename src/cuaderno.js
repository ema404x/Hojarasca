// Cuaderno de campo: qué se puede descubrir y cómo
import { CARTAS } from './correo.js';
import { CUENTOS } from './cuentos.js';
import { ENTRADAS_GRANJA } from './granja.js';
import { LIBROS_ALDEA, PLACA_DUENDE, CUENTOS_DOMINGO } from './aldea-lecturas.js';
export const SECCIONES = [
  { id: 'flora', nombre: 'Árboles y plantas' },
  { id: 'frutos', nombre: 'Flores, frutos y hongos' },
  { id: 'huerta', nombre: 'Del campo' },
  { id: 'fauna', nombre: 'Fauna' },
  { id: 'peces', nombre: 'Peces (se devuelven al agua)' },
  { id: 'rastros', nombre: 'Rastros' },
  { id: 'lugares', nombre: 'Lugares' },
  { id: 'cielo', nombre: 'Cielo' },
  { id: 'recetas', nombre: 'Al fuego' },
  { id: 'trueque', nombre: 'Del almacén' },
  { id: 'historias', nombre: 'Historias' },
  { id: 'fogon', nombre: 'Cuentos del fogón' },
  { id: 'encargos', nombre: 'Encargos' },
  { id: 'cartas', nombre: 'Cartas' },
  // 3.6 (mecánicas): la plaquita del duende, los libros de la biblioteca y los cuentos del domingo
  { id: 'pueblo', nombre: 'De la aldea' },
];

// modo: observar (acercarse y mirar) · anotar (E sobre la planta) · juntar (E, se guarda) · escuchar · llegar
export const ENTRADAS = [
  // ---------------------------------------------------------------- árboles y plantas
  { id: 'coihue', seccion: 'flora', nombre: 'Coihue', cientifico: 'Nothofagus dombeyi', modo: 'anotar', pista: 'El árbol más alto del bosque. Acercate a un tronco grueso y anotalo.',
    texto: 'Árbol siempreverde, uno de los más altos del bosque andino patagónico: puede superar los 40 metros. Sus hojas son chicas, dentadas y lustrosas, y sus copas se abren en pisos horizontales.' },
  { id: 'lenga', seccion: 'flora', nombre: 'Lenga', cientifico: 'Nothofagus pumilio', modo: 'anotar', pista: 'Copas redondeadas que en otoño cambian de color.',
    texto: 'Pierde las hojas en invierno y en otoño tiñe las laderas de rojo y naranja. En lo alto de la cordillera marca el límite del bosque, donde crece baja y retorcida por el viento y la nieve.' },
  { id: 'arrayan', seccion: 'flora', nombre: 'Arrayán', cientifico: 'Luma apiculata', modo: 'anotar', pista: 'Troncos color canela, cerca del agua.',
    texto: 'Su corteza lisa, color canela, se desprende en láminas y se siente fría al tacto. Crece a orillas de lagos y arroyos; da flores blancas y frutos oscuros comestibles. En la península de Quetrihué forma un bosque casi puro.' },
  { id: 'cipres', seccion: 'flora', nombre: 'Ciprés de la cordillera', cientifico: 'Austrocedrus chilensis', modo: 'anotar', pista: 'Una conífera oscura y puntiaguda.',
    texto: 'Conífera nativa de hojas en forma de escamas. Resiste bien la sequía, por eso es común en la zona de transición entre el bosque húmedo y la estepa.' },
  { id: 'pehuen', seccion: 'flora', nombre: 'Pehuén', cientifico: 'Araucaria araucana', modo: 'anotar', pista: 'Dicen que hay uno muy viejo en lo alto de un cerro.',
    texto: 'Árbol sagrado para el pueblo pewenche, que se alimentó de sus semillas durante siglos. Puede vivir más de mil años y su corteza gruesa lo protege del fuego.' },
  { id: 'colihue', seccion: 'flora', nombre: 'Caña colihue', cientifico: 'Chusquea culeou', modo: 'anotar', pista: 'Matorrales de cañas altas bajo los árboles.',
    texto: 'Bambú nativo que forma matorrales cerrados bajo el bosque. Florece toda junta, en toda una región, cada varias décadas, y después muere. La lluvia de semillas atrae a muchísimos ratones.' },
  { id: 'helecho', seccion: 'flora', nombre: 'Helecho costilla de vaca', cientifico: 'Blechnum chilense', modo: 'anotar', pista: 'Frondas grandes en lugares húmedos y sombríos.',
    texto: 'Helecho de frondas grandes y firmes que cubre el suelo de los rincones más húmedos y sombríos del bosque.' },
  { id: 'nalca', seccion: 'flora', nombre: 'Nalca', cientifico: 'Gunnera tinctoria', modo: 'anotar', pista: 'Hojas gigantes a orillas del agua.',
    texto: 'Sus hojas enormes, ásperas y plegadas pueden superar el metro de diámetro. Crece en suelos empapados, junto a arroyos y mallines. Sus tallos tiernos se comen en el sur de Chile.' },
  { id: 'chilco', seccion: 'flora', nombre: 'Chilco', cientifico: 'Fuchsia magellanica', modo: 'anotar', pista: 'Un arbusto con flores colgantes, rojas y violetas.',
    texto: 'Arbusto de flores colgantes rojas y violetas. Es uno de los preferidos del picaflor rubí, que lo visita durante todo el verano.' },
  { id: 'coiron', seccion: 'flora', nombre: 'Coirón', cientifico: 'Festuca pallescens', modo: 'anotar', pista: 'La mata amarillenta que cubre la estepa.',
    texto: 'La gramínea que cubre la estepa patagónica en matas duras y amarillentas, separadas unas de otras por suelo desnudo. Aguanta el viento, la sequía y el pisoteo, y es el alimento de las ovejas y los guanacos. Sin coirón, la Patagonia sería un desierto de piedra.' },
  { id: 'neneo', seccion: 'flora', nombre: 'Neneo', cientifico: 'Mulinum spinosum', modo: 'anotar', pista: 'Mata redonda y espinosa, entre los coirones.',
    texto: 'Mata redonda, espinosa y gris, de las que crecen en cojín para protegerse del viento. Da flores amarillas en verano y bajo su sombra se refugian pastos más tiernos.' },
  { id: 'estepa', seccion: 'lugares', nombre: 'La estepa', modo: 'llegar', pista: 'Caminá hacia el este hasta que se acaben los árboles.',
    texto: 'Donde el bosque se termina empieza la estepa: matas de coirón separadas por suelo desnudo, neneos en cojín, viento sin nada que lo frene y un cielo que no se termina nunca. El límite no es una línea: los árboles van raleando hasta quedar sueltos, y de golpe mirás atrás y el bosque quedó lejos.' },
  { id: 'nire', seccion: 'flora', nombre: 'Ñire', cientifico: 'Nothofagus antarctica', modo: 'anotar', pista: 'Chico y retorcido, en los mallines y bien arriba.',
    texto: 'El árbol más resistente del bosque andino: aguanta el frío, el viento y el suelo anegado. En los mallines crece torcido y bajo, casi como arbusto, y en otoño se pone de un rojo más oscuro que la lenga. Su leña es la más buscada para la salamandra.' },
  { id: 'maiten', seccion: 'flora', nombre: 'Maitén', cientifico: 'Maytenus boaria', modo: 'anotar', pista: 'Copa redonda y ramas colgantes, en los claros y junto al agua.',
    texto: 'De copa redonda y ramas que caen como un sauce. Se mantiene verde todo el año y por eso en los inviernos duros los puesteros cortaban sus ramas para dar de comer a los animales. Da sombra a los campos abiertos de toda la Patagonia.' },
  { id: 'maqui', seccion: 'flora', nombre: 'Maqui', cientifico: 'Aristotelia chilensis', modo: 'anotar', pista: 'Arbusto de frutos negros, en el borde del bosque.',
    texto: 'Arbusto de frutos negros y brillantes, dulces y muy oscuros: tiñen la boca y las manos. El pueblo mapuche lo considera un árbol sagrado y usaba sus hojas como remedio. Es de los primeros en crecer donde el bosque se abrió por un incendio.' },
  { id: 'chaura', seccion: 'flora', nombre: 'Chaura', cientifico: 'Gaultheria mucronata', modo: 'anotar', pista: 'Matita dura de frutitos rosados, arriba entre las piedras.',
    texto: 'Mata baja y dura, con hojas punzantes y frutos redondos que van del blanco al rosa fuerte. Crece donde casi nada más crece: pedreros, filos de viento y turberas. Los frutos son comestibles, aunque desabridos.' },
  { id: 'notro', seccion: 'flora', nombre: 'Notro', cientifico: 'Embothrium coccineum', modo: 'anotar', pista: 'Un arbolito de flores rojo fuego.',
    texto: 'Arbolito de flores tubulares rojo intenso que se destaca en los bordes del bosque. También lo polinizan los picaflores.' },

  // ---------------------------------------------------------------- flores, frutos y hongos
  { id: 'amancay', seccion: 'frutos', nombre: 'Amancay', cientifico: 'Alstroemeria aurea', modo: 'anotar', pista: 'Flores anaranjadas en los claros.',
    texto: 'Flor amarilla y anaranjada con pintas oscuras que alegra los claros en verano. Protagoniza una leyenda de amor muy contada en la región.' },
  { id: 'frutilla', seccion: 'frutos', nombre: 'Frutilla silvestre', cientifico: 'Fragaria chiloensis', modo: 'juntar', pista: 'Frutitas rojas al borde del sendero.',
    texto: 'Frutilla nativa del sur de Chile y Argentina. Es una de las dos especies que, cruzadas, dieron origen a la frutilla que se cultiva hoy en todo el mundo.' },
  { id: 'haba', seccion: 'huerta', nombre: 'Habas', cientifico: 'Vicia faba', modo: 'cosechar', pista: 'Se siembran en un cantero (O → Trabajo) con semilla del almacén.',
    texto: 'Llegaron al sur con los colonos y se quedaron: aguantan el frío y la tierra pobre mejor que casi cualquier cosa de huerta. Las chauchas se abren a mano y los granos verdes se comen salteados.' },
  { id: 'papa', seccion: 'huerta', nombre: 'Papa', cientifico: 'Solanum tuberosum', modo: 'cosechar', pista: 'Tarda una semana en el cantero, pero rinde.',
    texto: 'Chiloé, del otro lado de la cordillera, es uno de los centros de origen de la papa: los huilliches cultivaban cientos de variedades. En la Patagonia se siembra en primavera y se aporca cuando asoma la mata.' },
  { id: 'frutilla-huerta', seccion: 'huerta', nombre: 'Frutilla de cantero', cientifico: 'Fragaria chiloensis', modo: 'cosechar', pista: 'Se siembra de un estolón de las silvestres.',
    texto: 'La misma frutilla del sendero, pero en tierra removida y sin competir con el pasto: da más, más pareja y más grande. Así empezó a cultivarse, hace siglos, en el sur de Chile.' },
  { id: 'vellon', seccion: 'huerta', nombre: 'Vellón de lana', cientifico: 'de la majada del galpón', modo: 'cosechar', pista: 'Con la tijera, en el corral del galpón de esquila.',
    texto: 'Sale entero, como una manta: se esquila de la panza al lomo y la lana queda unida. Se lava, se carda y se hila. Con dos se teje una alfombra.' },
  { id: 'oveja', seccion: 'fauna', nombre: 'Oveja', cientifico: 'Ovis aries · Corriedale y Merino', modo: 'observar', pista: 'En el corral grande del galpón de esquila.',
    texto: 'Llegaron a la Patagonia a fines del siglo XIX y cambiaron todo: los galpones, los alambrados, los pueblos. La Corriedale, de cara negra, da carne y lana; la Merino, de lana más fina, aguanta mejor el frío seco de la meseta. La lana les vuelve a crecer en pocas semanas.' },
  { id: 'calafate', seccion: 'frutos', nombre: 'Calafate', cientifico: 'Berberis microphylla', modo: 'juntar', pista: 'Arbusto espinoso de flores amarillas, en lugares abiertos.',
    texto: 'Arbusto espinoso de flores amarillas y frutos azul violáceo. Dice la tradición que quien come calafate vuelve a la Patagonia.' },
  { id: 'llaollao', seccion: 'frutos', nombre: 'Llao llao', cientifico: 'Cyttaria hariotii', modo: 'anotar', pista: 'Bolitas anaranjadas pegadas a los troncos.',
    texto: 'Hongo que vive sobre ramas de Nothofagus y les forma nudos. Sus cuerpos anaranjados, redondos y llenos de hoyitos son comestibles. Le da nombre a una península del Nahuel Huapi.' },
  { id: 'pinon', seccion: 'frutos', nombre: 'Piñón', cientifico: 'semilla de Araucaria araucana', modo: 'juntar', pista: 'Caen al pie del pehuén.',
    texto: 'Semilla grande del pehuén. Se come hervida o tostada y fue un alimento fundamental para el pueblo pewenche.' },
  { id: 'pluma', seccion: 'frutos', nombre: 'Pluma de cachaña', cientifico: 'Enicognathus ferrugineus', modo: 'juntar', pista: 'Algo verde brilla entre la hojarasca.',
    texto: 'Pluma verde de cachaña, el loro más austral del mundo. Encontrarla es la mejor pista de que una bandada anda cerca.' },
  { id: 'canto', seccion: 'frutos', nombre: 'Canto rodado', cientifico: 'piedra de la orilla', modo: 'juntar', pista: 'Piedras redondas junto al agua.',
    texto: 'Piedra pulida por el agua durante miles de años. Los grandes lagos de la región ocupan valles que excavaron los glaciares.' },

  // ---------------------------------------------------------------- fauna
  { id: 'pudu', seccion: 'fauna', nombre: 'Pudú', cientifico: 'Pudu puda', modo: 'observar', pista: 'Muy tímido. Moverse despacio y agachado ayuda.',
    texto: 'El ciervo más chico del mundo: mide unos 40 centímetros de alto. Vive en el bosque cerrado y huye ante el menor ruido. Los machos tienen cuernos cortos y simples.' },
  { id: 'carpintero', seccion: 'fauna', nombre: 'Carpintero gigante', cientifico: 'Campephilus magellanicus', modo: 'observar', pista: 'Seguí el golpeteo doble sobre los troncos. Los prismáticos ayudan.',
    texto: 'El carpintero más grande de Sudamérica. El macho tiene la cabeza roja; la hembra, negra, con un copete curvado. Su golpeteo doble resuena lejos en el bosque.' },
  { id: 'chucao', seccion: 'fauna', nombre: 'Chucao', cientifico: 'Scelorchilus rubecula', modo: 'escuchar', pista: 'Un canto fuerte que sale de la espesura.',
    texto: 'Pajarito de pecho rojizo que vive escondido en el sotobosque: es mucho más fácil oírlo que verlo. Para la tradición mapuche, su canto anuncia buena o mala suerte según de qué lado se escuche.' },
  { id: 'cachana', seccion: 'fauna', nombre: 'Cachaña', cientifico: 'Enicognathus ferrugineus', modo: 'observar', pista: 'Bandadas verdes y ruidosas que cruzan el cielo.',
    texto: 'El loro más austral del mundo. Anda en bandadas bulliciosas que comen semillas de los Nothofagus y piñones.' },
  { id: 'condor', seccion: 'fauna', nombre: 'Cóndor andino', cientifico: 'Vultur gryphus', modo: 'observar', pista: 'Mirá hacia arriba desde los lugares altos.',
    texto: 'Una de las aves voladoras más grandes del mundo: sus alas abiertas miden cerca de tres metros. Aprovecha las corrientes de aire caliente para planear durante horas casi sin aletear.' },
  { id: 'concon', seccion: 'fauna', nombre: 'Concón', cientifico: 'Strix rufipes', modo: 'escuchar', pista: 'Se escucha de noche.',
    texto: 'Búho del bosque templado, de patas rojizas. Su canto grave y repetido acompaña las noches del bosque.' },

  { id: 'huemul', seccion: 'fauna', nombre: 'Huemul', cientifico: 'Hippocamelus bisulcus', modo: 'observar', pista: 'Muy escaso. Buscalo en lo alto, al amanecer o al atardecer.',
    texto: 'Ciervo andino de pelaje pardo grisáceo, en peligro de extinción. En Argentina es Monumento Natural Nacional y figura en el escudo de Chile. Quedan muy pocos en toda la cordillera.' },
  { id: 'zorro', seccion: 'fauna', nombre: 'Zorro colorado', cientifico: 'Lycalopex culpaeus', modo: 'observar', pista: 'Recorre los senderos cuando cae el sol.',
    texto: 'Uno de los cánidos más grandes de Sudamérica. Al anochecer anda por los senderos y a veces se detiene a mirar con curiosidad antes de seguir su camino.' },
  { id: 'cisne', seccion: 'fauna', nombre: 'Cisne de cuello negro', cientifico: 'Cygnus melancoryphus', modo: 'observar', pista: 'Nada tranquilo en el lago.',
    texto: 'Cuerpo blanco, cuello negro y una carúncula roja sobre el pico. Los pichones suelen viajar arriba del lomo de sus padres.' },
  { id: 'patotorrente', seccion: 'fauna', nombre: 'Pato de los torrentes', cientifico: 'Merganetta armata', modo: 'observar', pista: 'Donde el arroyo baja con más fuerza.',
    texto: 'Vive en arroyos correntosos de montaña y nada con soltura contra la corriente. El macho tiene la cabeza blanca con líneas negras.' },
  { id: 'martin', seccion: 'fauna', nombre: 'Martín pescador grande', cientifico: 'Megaceryle torquata', modo: 'observar', pista: 'Espera quieto sobre el arroyo.',
    texto: 'El martín pescador más grande de América. Espera inmóvil sobre una rama y se zambulle de cabeza para atrapar peces.' },
  { id: 'picaflor', seccion: 'fauna', nombre: 'Picaflor rubí', cientifico: 'Sephanoides sephaniodes', modo: 'observar', pista: 'Quedate cerca de un chilco florecido.',
    texto: 'Diminuto y de reflejos verdes; el macho lleva una corona roja brillante. Poliniza chilcos y notros, y muchos migran hacia el norte cuando llega el frío.' },
  { id: 'bandurria', seccion: 'fauna', nombre: 'Bandurria austral', cientifico: 'Theristicus melanopis', modo: 'observar', pista: 'Grupos ruidosos en los pastizales abiertos.',
    texto: 'Ave de patas largas y pico curvo que busca insectos y larvas en los pastizales. Su grito metálico, casi siempre en grupo, se oye desde muy lejos.' },

  { id: 'perro', seccion: 'fauna', nombre: 'Perro ovejero', cientifico: 'Canis familiaris', modo: 'observar', pista: 'Te sigue desde el refugio.',
    texto: 'Perro de campo, de los que en la Patagonia trabajan con las majadas y se crían entre las ovejas. Va y viene, se adelanta a olfatear y vuelve. Cuando se queda duro mirando fijo hacia un lado y ladra corto, casi siempre hay un animal ahí.' },
  { id: 'guanaco', seccion: 'fauna', nombre: 'Guanaco', cientifico: 'Lama guanicoe', modo: 'observar', pista: 'En tropilla, en la estepa del este.',
    texto: 'El camélido silvestre de la Patagonia, pariente de la llama y del vicuña. Andan en tropilla con un macho que hace de centinela: si algo no le gusta, levanta el cuello, chilla y salen todos al trote. Corren a sesenta por hora y saltan alambrados de metro y medio.' },
  { id: 'zorzal', seccion: 'fauna', nombre: 'Zorzal patagónico', cientifico: 'Turdus falcklandii', modo: 'observar', pista: 'Picotea el suelo en los claros y sale volando si te acercás.',
    texto: 'Pardo con el pecho anaranjado y el pico amarillo. Anda por el suelo dando saltitos y picoteando lombrices. Es el que canta primero, antes de que aclare, y el último en callarse.' },
  { id: 'lagartija', seccion: 'fauna', nombre: 'Lagartija', cientifico: 'Liolaemus sp.', modo: 'observar', pista: 'Al sol sobre una piedra, al mediodía.',
    texto: 'Se calienta al sol sobre las piedras porque no regula su temperatura sola: por eso solo aparece en las horas del mediodía. Si te acercás se escurre entre las grietas en un instante. En la Patagonia hay decenas de especies del género Liolaemus.' },
  { id: 'ciervo', seccion: 'fauna', nombre: 'Ciervo colorado', cientifico: 'Cervus elaphus', modo: 'observar', pista: 'Grande y ruidoso. En otoño los machos braman.',
    texto: 'Ciervo europeo traído a la Patagonia en 1922 para la caza deportiva. Hoy es una especie invasora: come renovales de lenga y coihue y compite con el huemul. En otoño los machos braman para marcar territorio y se los oye desde muy lejos.' },
  { id: 'jabali', seccion: 'fauna', nombre: 'Jabalí', cientifico: 'Sus scrofa', modo: 'observar', pista: 'Andan en piara y dejan el suelo revuelto.',
    texto: 'También introducido para la caza. Hozando en busca de raíces y hongos da vuelta el mantillo del bosque, lo que daña los renovales. Anda en grupos llamados piaras.' },
  { id: 'liebre', seccion: 'fauna', nombre: 'Liebre europea', cientifico: 'Lepus europaeus', modo: 'observar', pista: 'Cruza el sendero de golpe y se va en zigzag.',
    texto: 'Introducida a fines del siglo XIX, hoy está por toda la Patagonia. Corre en zigzag para escapar y puede alcanzar los 60 kilómetros por hora.' },
  { id: 'coipo', seccion: 'fauna', nombre: 'Coipo', cientifico: 'Myocastor coypus', modo: 'observar', pista: 'Nada en la orilla y se zambulle si te acercás.',
    texto: 'Roedor nativo, buen nadador, de patas traseras con membranas. Vive en las orillas de lagos y arroyos, donde cava cuevas. En Europa se lo conoce como nutria.' },
  { id: 'cauquen', seccion: 'fauna', nombre: 'Cauquén común', cientifico: 'Chloephaga picta', modo: 'observar', pista: 'Parejas pastando en los claros.',
    texto: 'Ave que parece un ganso y pasta en pastizales abiertos. Casi siempre anda en pareja: el macho es blanco y la hembra, canela con patas amarillas.' },
  { id: 'murcielago', seccion: 'fauna', nombre: 'Murciélago orejudo', cientifico: 'Histiotus montanus', modo: 'observar', pista: 'Justo cuando se va la luz, sobre los claros.',
    texto: 'De orejas enormes, caza insectos al vuelo guiándose por el eco de sus propios chillidos. Sale a cazar en el rato justo entre el atardecer y la noche cerrada.' },
  { id: 'manganga', seccion: 'fauna', nombre: 'Mangangá', cientifico: 'Bombus dahlbomii', modo: 'observar', pista: 'Un abejorro enorme y naranja, en las flores.',
    texto: 'El abejorro más grande del mundo, cubierto de pelos anaranjados. Es nativo y está amenazado: la llegada de abejorros europeos para polinizar cultivos trajo parásitos que lo están haciendo desaparecer.' },
  { id: 'panal', seccion: 'fauna', nombre: 'Panal silvestre', cientifico: 'Apis mellifera', modo: 'anotar', pista: 'Dentro de un tronco hueco, con un zumbido constante.',
    texto: 'Colmena de abejas europeas asilvestradas dentro de un tronco hueco. En la región producen la miel de ulmo y de quillay. Mejor mirar de lejos y seguir camino.' },
  { id: 'mariposa', seccion: 'fauna', nombre: 'Dama pintada', cientifico: 'Vanessa carye', modo: 'observar', pista: 'En los claros soleados del mediodía.',
    texto: 'Mariposa anaranjada con manchas negras y blancas, común en todo el país. Migra en grupos enormes que a veces cruzan la Patagonia entera.' },

  // ---------------------------------------------------------------- peces
  { id: 'arcoiris', seccion: 'peces', nombre: 'Trucha arcoíris', cientifico: 'Oncorhynchus mykiss', modo: 'pescar', pista: 'Común en el lago y en el arroyo.',
    texto: 'Llegó desde Norteamérica a comienzos del siglo XX. Tiene una franja rosada a lo largo del cuerpo y hoy es una de las especies más buscadas por los pescadores patagónicos.' },
  { id: 'marron', seccion: 'peces', nombre: 'Trucha marrón', cientifico: 'Salmo trutta', modo: 'pescar', pista: 'Las grandes comen al amanecer y al anochecer.',
    texto: 'Traída de Europa a comienzos del siglo XX. Tiene pintas negras y rojas rodeadas de un halo claro. Los ejemplares grandes cazan sobre todo con poca luz.' },
  { id: 'fontinalis', seccion: 'peces', nombre: 'Trucha de arroyo', cientifico: 'Salvelinus fontinalis', modo: 'pescar', pista: 'Prefiere el agua fría del arroyo.',
    texto: 'Aunque le dicen trucha, es un salvelino de Norteamérica. Prefiere arroyos fríos y se reconoce por el borde blanco de sus aletas.' },
  { id: 'perca', seccion: 'peces', nombre: 'Perca criolla', cientifico: 'Percichthys trucha', modo: 'pescar', pista: 'Un pez nativo del lago.',
    texto: 'Pez nativo de lagos y ríos patagónicos, también llamado trucha criolla. Las truchas introducidas compiten con él por el alimento.' },
  { id: 'pejerrey', seccion: 'peces', nombre: 'Pejerrey patagónico', cientifico: 'Odontesthes hatcheri', modo: 'pescar', pista: 'Anda en cardúmenes cerca de la costa del lago.',
    texto: 'Pez nativo y plateado que se mueve en cardúmenes por las costas de los lagos de la región.' },

  // ---------------------------------------------------------------- rastros (2.1)
  { id: 'rastro-huemul', seccion: 'rastros', nombre: 'Huellas de huemul', cientifico: 'pezuña partida, grande', modo: 'rastrear', pista: 'Una hilera de pezuñas grandes en el barro. Acercate y mirala (E).',
    texto: 'Dos mitades en punta, de unos ocho centímetros, bien hundidas: es un animal pesado. Cuando va tranquilo pone la pata de atrás casi encima de la de adelante. Seguirlas es la mejor forma de ver uno.' },
  { id: 'rastro-pudu', seccion: 'rastros', nombre: 'Huellas de pudú', cientifico: 'pezuña partida, chiquita', modo: 'rastrear', pista: 'Pezuñas tan chicas que parecen de cabra. Entre la caña colihue.',
    texto: 'Del tamaño de una moneda grande, con pasos muy cortos y muy juntos. El pudú no se aleja del sotobosque: si el rastro sale a un claro, enseguida vuelve a meterse.' },
  { id: 'rastro-guanaco', seccion: 'rastros', nombre: 'Huellas de guanaco', cientifico: 'dos dedos con almohadilla', modo: 'rastrear', pista: 'En la estepa, pisadas anchas y separadas.',
    texto: 'El guanaco no tiene pezuña dura: apoya dos dedos sobre una almohadilla blanda, y por eso casi no daña el suelo. Las huellas son anchas y el paso largo.' },
  { id: 'rastro-zorro', seccion: 'rastros', nombre: 'Huellas de zorro', cientifico: 'almohadilla y cuatro dedos', modo: 'rastrear', pista: 'Una almohadilla y cuatro dedos, en línea recta.',
    texto: 'Cuatro dedos con las uñas marcadas y una almohadilla atrás. El zorro camina poniendo una pata delante de la otra, así que el rastro sale casi como una línea de puntos.' },
  { id: 'rastro-liebre', seccion: 'rastros', nombre: 'Huellas de liebre', cientifico: 'dos largas adelante, dos cortas atrás', modo: 'rastrear', pista: 'Grupos de cuatro marcas: dos largas y dos chicas.',
    texto: 'La liebre salta: las patas de atrás, largas, caen por delante de las de adelante. Por eso las dos marcas largas quedan adelante, al revés de lo que uno pensaría.' },

  // ---------------------------------------------------------------- cielo
  { id: 'cruz-del-sur', seccion: 'cielo', nombre: 'Cruz del Sur', cientifico: 'Crux', modo: 'observar', pista: 'De noche, mirá hacia el sur y quedate un rato.',
    texto: 'Cuatro estrellas en cruz, la constelación más chica del cielo y la más usada del hemisferio sur. Si prolongás su eje mayor cuatro veces y media hacia abajo, llegás al polo sur celeste: ahí está el sur, sin brújula. Está en las banderas de cinco países.' },
  { id: 'tres-marias', seccion: 'cielo', nombre: 'Las Tres Marías', cientifico: 'cinturón de Orión', modo: 'observar', pista: 'Tres estrellas alineadas y parejas, hacia el norte.',
    texto: 'El cinturón de Orión: Alnitak, Alnilam y Mintaka, casi perfectamente alineadas. Desde el sur se ven "de cabeza" respecto al norte. Varios pueblos originarios las usaban para marcar las épocas de siembra y de cosecha.' },
  { id: 'magallanes', seccion: 'cielo', nombre: 'Nubes de Magallanes', cientifico: 'Nubecula Maior y Minor', modo: 'observar', pista: 'Dos manchas pálidas, bien al sur, lejos de la luna.',
    texto: 'Dos galaxias enanas vecinas de la Vía Láctea, visibles a simple vista solo desde el hemisferio sur. La grande está a unos 160.000 años luz. Los navegantes las usaban para orientarse mucho antes de que se supiera qué eran.' },
  { id: 'escorpio', seccion: 'cielo', nombre: 'Escorpio', cientifico: 'Scorpius', modo: 'observar', pista: 'Una curva larga de estrellas, con una roja bien marcada.',
    texto: 'Una de las pocas constelaciones que se parece a lo que nombra: la cola curva se ve clarísima. Su estrella más brillante, Antares, es roja y enorme, cientos de veces más grande que el Sol.' },
  // 2.0: el cielo cambia de una noche a otra
  { id: 'luna-llena', seccion: 'cielo', nombre: 'Luna llena', cientifico: 'plenilunio', modo: 'observar', pista: 'La luna cambia de noche en noche. Esperá a que esté entera y mirala un rato.',
    texto: 'En el hemisferio sur la luna no miente: cuando dibuja una C está creciendo, y cuando dibuja una D está menguando. En el norte es al revés, y por eso allá le dicen mentirosa. Con luna llena se camina el bosque sin linterna, pero las estrellas débiles desaparecen.' },
  { id: 'geminidas', seccion: 'cielo', nombre: 'Lluvia de estrellas', cientifico: 'Gemínidas', modo: 'observar', pista: 'Algunas noches de verano llueven estrellas. Mirá hacia el norte, a cielo abierto.',
    texto: 'Cada diciembre la Tierra cruza el polvo que dejó el asteroide Faetón, y los granos se queman al entrar en el aire: en el sur cae en pleno verano. Desde la Patagonia las estrellas fugaces salen de muy bajo, del lado norte. Las mejores horas son después de medianoche, lejos de toda luz.' },

  // ---------------------------------------------------------------- al fuego
  { id: 'pinones-tostados', seccion: 'recetas', nombre: 'Piñones tostados', modo: 'cocinar', pista: 'Hacen falta tres piñones y un fuego encendido.',
    texto: 'Se tiran sobre las brasas hasta que la cáscara se abre sola. Adentro queda una pasta harinosa y dulce, tibia. Los pewenche juntaban piñones en marzo y los guardaban enterrados para todo el invierno.' },
  { id: 'dulce-calafate', seccion: 'recetas', nombre: 'Dulce de calafate', modo: 'cocinar', pista: 'Cuatro puñados de calafate junto al fuego.',
    texto: 'Los frutos se deshacen en la olla hasta quedar espesos y morados. En la Patagonia se usa para acompañar quesos o untar pan casero. Y ya sabés lo que dicen: el que come calafate, vuelve.' },
  { id: 'te-galesa', seccion: 'recetas', nombre: 'Té con torta galesa', modo: 'cocinar', pista: 'Sentate en la galería de la Casa de Té.',
    texto: 'Té negro y una porción de torta galesa: densa, oscura, con frutas y especias. Los galeses llegaron al Chubut en 1865 y la receta viajó con ellos; hoy es el símbolo de las casas de té del sur.' },
  { id: 'mate', seccion: 'recetas', nombre: 'Unos mates', modo: 'cocinar', pista: 'En la Casa de Té también se ceba mate.',
    texto: 'Agua a punto, la yerba de costado y el primer mate para el que ceba, que siempre sale lavado. Se toma en ronda y en silencio: nadie dice gracias hasta que ya no quiere más.' },
  { id: 'papas-rescoldo', seccion: 'recetas', nombre: 'Papas al rescoldo', modo: 'cocinar', pista: 'Tres papas de tu cantero, enterradas en las brasas.',
    texto: 'Se entierran enteras en la ceniza caliente y se olvidan media hora. Salen negras por fuera y harinosas por dentro; se parten con la mano y se comen con sal gruesa.' },
  { id: 'habas-salteadas', seccion: 'recetas', nombre: 'Habas salteadas', modo: 'cocinar', pista: 'Cuatro puñados de habas de tu cantero y un fuego.',
    texto: 'Se pelan las chauchas, se pasan los granos por la sartén con un poco de grasa y se comen tibios. Es comida de huerta de campo: lo que hay, cuando hay.' },
  { id: 'chocolate', seccion: 'recetas', nombre: 'Chocolate caliente', modo: 'cocinar', pista: 'Lo mejor para un día de lluvia en la casa de té.',
    texto: 'Espeso, de taza, como el que hizo famosa a la cordillera. La tradición chocolatera del sur la trajeron inmigrantes italianos y suizos a mediados del siglo pasado.' },
  { id: 'frutillas-brasas', seccion: 'recetas', nombre: 'Frutillas al rescoldo', modo: 'cocinar', pista: 'Tres frutillas silvestres sobre las brasas.',
    texto: 'Tibias y apenas asadas, la frutilla silvestre concentra el perfume. Son mucho más chicas y más perfumadas que las de huerta.' },
  // 2.1: las conservas (ver `conservas.js`)
  { id: 'frasco-frutilla', seccion: 'recetas', nombre: 'Dulce de frutilla en frasco', modo: 'cocinar', pista: 'Cuatro frutillas al fuego, cuando ya sabés hacerlas al rescoldo.',
    texto: 'Se cocina despacio, con la tapa del frasco hervida aparte. Bien cerrado dura hasta el invierno, que es cuando más se agradece. En el almacén lo toman como si fuera plata.' },
  { id: 'calafate-seco', seccion: 'recetas', nombre: 'Calafates secos', modo: 'cocinar', pista: 'Cinco calafates colgados en un tendal, medio día de sol.',
    texto: 'Al sol se arrugan y se vuelven dulces como pasas. Se comen con el mate o se guardan para el invierno en una bolsita de tela.' },
  { id: 'hongos-secos', seccion: 'recetas', nombre: 'Llao llao seco', modo: 'cocinar', pista: 'Tres llao llao colgados en un tendal, medio día de sol.',
    texto: 'Secos pierden el agua y ganan gusto. Los pueblos del sur los comían frescos en primavera; secos, se guardan para cuando el bosque ya no da nada.' },

  // ---------------------------------------------------------------- encargos
  { id: 'e-arboles', seccion: 'encargos', nombre: 'Los cinco árboles', cientifico: 'encargo de Josefina', modo: 'encargo', pista: 'Josefina te lo va a pedir cuando terminen de charlar.',
    texto: 'Coihue, lenga, arrayán, ciprés y pehuén anotados. Con esos cinco ya se lee una ladera de lejos: dónde hay agua, dónde pega el viento, dónde se quemó hace años.' },
  { id: 'e-carpintero', seccion: 'encargos', nombre: 'El golpeteo doble', cientifico: 'encargo de Josefina', modo: 'encargo', pista: 'Josefina necesita una foto para el registro.',
    texto: 'Donde hay carpinteros gigantes hay árboles viejos, y los árboles viejos son los que sostienen todo lo demás: los huecos, los hongos, los insectos, las aves que anidan.' },
  { id: 'e-lugares', seccion: 'encargos', nombre: 'Las cuatro puntas', cientifico: 'encargo de Don Ramón', modo: 'encargo', pista: 'Preguntale a Don Ramón cómo se conoce un valle.',
    texto: 'Mirador, puesto, faro y estación. El valle entero caminado, que es la única forma de aprenderlo.' },
  { id: 'e-fuego', seccion: 'encargos', nombre: 'Piñones al fuego', cientifico: 'encargo de Don Ramón', modo: 'encargo', pista: 'Don Ramón insiste con probarlos calientes.',
    texto: 'Tres piñones sobre las brasas hasta que la cáscara se abre sola. Esa semilla alimentó gente en esta cordillera durante siglos.' },
  { id: 'e-vuelta', seccion: 'encargos', nombre: 'La vuelta completa', cientifico: 'encargo de Elsa', modo: 'encargo', pista: 'La guarda del tren te lo va a proponer.',
    texto: 'Dos kilómetros de anillo sin bajarse: el lago de un lado, la cordillera del otro y el bosque pasando siempre por la ventanilla.' },
  { id: 'e-puesto', seccion: 'encargos', nombre: 'Levantar lo tuyo', cientifico: 'encargo de Don Ramón', modo: 'encargo', pista: 'Don Ramón te lo va a proponer en su puesto.',
    texto: 'Cuatro paredes y un techo, levantados con lo que junté yo mismo. Piedra abajo, tronco sobre tronco, tablas para el piso y el techo. Ahora sé lo que cuesta cada una.' },
  { id: 'e-pesca', seccion: 'encargos', nombre: 'Tres de tres', cientifico: 'encargo de Nicanor', modo: 'encargo', pista: 'Nicanor te va a desafiar con las truchas.',
    texto: 'Arcoíris, marrón y de arroyo, las tres devueltas al agua. Leer el agua es saber dónde para el pez, a qué hora come y cuándo no vale la pena insistir.' },
  { id: 'e-tren', seccion: 'encargos', nombre: 'Subite una vez', cientifico: 'encargo de Nicanor', modo: 'encargo', pista: 'Nicanor dice que hay que hacerlo una vez en la vida.',
    texto: 'El único tren que te deja mirar el bosque sin apurarlo.' },

  { id: 'e-nocturno', seccion: 'encargos', nombre: 'Turno de noche', cientifico: 'encargo de Josefina', modo: 'encargo', pista: 'Josefina quiere que salgas de noche.',
    texto: 'El bosque no se apaga a la noche: cambia de turno. Los de día duermen y salen los otros, con el concón cantando y los murciélagos cazando en los claros.' },
  { id: 'e-invasoras', seccion: 'encargos', nombre: 'Los de afuera', cientifico: 'encargo de Don Ramón', modo: 'encargo', pista: 'Don Ramón quiere que los veas con tus ojos.',
    texto: 'Ciervo colorado, jabalí y liebre europea: tres animales que no deberían estar y sin embargo mandan. Cuidar un bosque también es sacar lo que sobra.' },
  { id: 'e-cocina', seccion: 'encargos', nombre: 'La mesa del bosque', cientifico: 'encargo de Nicanor', modo: 'encargo', pista: 'Nicanor quiere saber cuál te gustó más.',
    texto: 'Piñones, dulce de calafate y frutillas al rescoldo. Comer lo que junta uno mismo tiene otro gusto.' },
  { id: 'e-madera', seccion: 'encargos', nombre: 'Madera para el invierno', cientifico: 'encargo de Don Ramón', modo: 'encargo', pista: 'Don Ramón quiere ver si sabés sacar madera.',
    texto: 'Tres hachazos y el árbol cae: cuatro troncos. Aserrado a mano rinde dos tablas por tronco, y en el banco de carpintero, cuatro. El pehuén no se toca.' },
  { id: 'e-banco', seccion: 'encargos', nombre: 'El banco primero', cientifico: 'encargo de Don Ramón', modo: 'encargo', pista: 'Don Ramón te va a decir por dónde empezar.',
    texto: 'Cuatro troncos y dos piedras. Al lado del banco, cada tronco rinde el doble: el que empieza por el banco termina antes.' },
  { id: 'e-acopio', seccion: 'encargos', nombre: 'Dejar de cargar todo', cientifico: 'encargo de Don Ramón', modo: 'encargo', pista: 'Don Ramón te ve ir y venir con el monte encima.',
    texto: 'Un acopio al lado de la obra: se guarda una vez y se construye tranquilo, porque lo que levantás se paga solo de la pila.' },
  { id: 'e-renovales', seccion: 'encargos', nombre: 'Devolver lo que sacaste', cientifico: 'encargo de Josefina', modo: 'encargo', pista: 'Josefina piensa en los que vienen después.',
    texto: 'Si talás, plantá. Un renoval junto a un tocón apura el rebrote; en unos días no se sabe dónde estuvo el hacha.' },
  { id: 'e-chinches', seccion: 'encargos', nombre: 'Tu propio mapa', cientifico: 'encargo del guarda', modo: 'encargo', pista: 'El guarda dice que el mapa es suyo pero las marcas son tuyas.',
    texto: 'Un mapa ajeno te dice dónde están las cosas; el propio te dice qué te importa. Las chinches se ponen con un clic y la brújula te lleva.' },
  { id: 'e-nocheagua', seccion: 'encargos', nombre: 'La picada de la tarde', cientifico: 'encargo de Nicanor', modo: 'encargo', pista: 'Nicanor sabe a qué hora comen las truchas.',
    texto: 'Después de las siete, con el sol bajo, la trucha come sin mirar. El resto del día se pesca; a esa hora se saca.' },
  { id: 'e-valle', seccion: 'encargos', nombre: 'Lo que aprendiste', cientifico: 'encargo de Josefina', modo: 'encargo', pista: 'Josefina no lo va a pedir hasta que no quede ningún otro encargo abierto.',
    texto: 'El último no pide nada: pide volver. Sacar madera sin arruinar el monte, devolver lo que sacaste, leer el agua, caminar el valle de punta a punta. Todo junto no te hace dueño de nada, pero te deja quedarte.' },

  // ---------------------------------------------------------------- historias
  { id: 'h-calafate', seccion: 'historias', nombre: 'El que come calafate, vuelve', cientifico: 'contada por Don Ramón', modo: 'escuchar', pista: 'Alguien en el Puesto Alto la cuenta bien.',
    texto: 'Una anciana quedó sola cuando su gente bajó al norte por el invierno, y donde murió esperándolos creció un arbusto espinoso lleno de frutos dulces. De ahí viene: el que come calafate, vuelve a la Patagonia.' },
  { id: 'h-pehuen', seccion: 'historias', nombre: 'El árbol que dio de comer', cientifico: 'contada por Don Ramón', modo: 'escuchar', pista: 'Preguntale al puestero por la araucaria.',
    texto: 'Los pewenche subían a la cordillera cada marzo a juntar piñones, los hervían y los enterraban para pasar el invierno. Su nombre significa gente del pehuén.' },
  { id: 'h-nieve', seccion: 'historias', nombre: 'El invierno de la ceniza', cientifico: 'contada por Don Ramón', modo: 'escuchar', pista: 'Cuarenta inviernos en el mismo puesto dan para contar.',
    texto: 'Un volcán del otro lado de la cordillera cubrió el valle de ceniza gris durante días. Al año siguiente el bosque estaba más verde que nunca.' },
  { id: 'h-ciervos', seccion: 'historias', nombre: 'Los que no eran de acá', cientifico: 'contada por Don Ramón', modo: 'escuchar', pista: 'Preguntale por los bramidos de otoño.',
    texto: 'Los ciervos colorados llegaron de Europa en los años veinte para la caza deportiva. Hoy comen los renovales del bosque y desplazan al huemul.' },
  { id: 'h-viento', seccion: 'historias', nombre: 'El viento que no para', cientifico: 'contada por Don Ramón', modo: 'escuchar', pista: 'Preguntale por los árboles inclinados del filo.',
    texto: 'El viento del oeste baja seco de la cordillera y no para nunca. Los árboles del filo crecen con todas las ramas para un lado: se les dice árboles bandera, y sirven de veleta.' },
  { id: 'h-cabalgata', seccion: 'historias', nombre: 'La veranada', cientifico: 'contada por Don Ramón', modo: 'escuchar', pista: 'Preguntale qué hacía con los animales en diciembre.',
    texto: 'Subir los animales a la montaña en diciembre y bajarlos en marzo, tres días de arreo durmiendo donde agarre la noche. Arriba hay pasto tierno cuando abajo ya está todo seco.' },
  { id: 'h-semillas', seccion: 'historias', nombre: 'El año de la caña', cientifico: 'contada por Josefina', modo: 'escuchar', pista: 'Preguntale por la floración del colihue.',
    texto: 'La caña colihue florece toda junta cada varias décadas y después muere. La lluvia de semillas llena el bosque de ratones, y detrás vienen los zorros y las lechuzas.' },
  { id: 'h-liquenes', seccion: 'historias', nombre: 'La barba del viejo', cientifico: 'contada por Josefina', modo: 'escuchar', pista: 'Preguntale por los mechones grises de las ramas.',
    texto: 'Los líquenes viven del aire y de la humedad, y son el mejor medidor de aire limpio que existe: donde hay humo desaparecen primero.' },
  { id: 'h-hielo', seccion: 'historias', nombre: 'El lago que no se congela', cientifico: 'contada por Nicanor', modo: 'escuchar', pista: 'Preguntale qué pasa con el lago en invierno.',
    texto: 'Los lagos grandes casi nunca se congelan: son hondos y el agua se mueve. Se congelan las lagunas chicas y los bordes, donde quedan las huellas del zorro cruzando.' },
  { id: 'h-bosque-hundido', seccion: 'historias', nombre: 'El bosque de abajo', cientifico: 'contada por Nicanor', modo: 'escuchar', pista: 'Preguntale qué se ve en el fondo del lago.',
    texto: 'Troncos parados en el fondo, todavía con ramas: árboles que quedaron bajo el agua cuando subió el nivel. El agua fría los conserva como si fuera ayer.' },
  { id: 'h-chucao', seccion: 'historias', nombre: 'El pájaro que avisa', cientifico: 'contada por Josefina', modo: 'escuchar', pista: 'La guardaparque anda por el mirador.',
    texto: 'Para la tradición mapuche el canto del chucao se interpreta según de qué lado llega. Josefina lo usa además como termómetro: si los pájaros callan de golpe, algo pasó en el bosque.' },
  { id: 'h-huemul', seccion: 'historias', nombre: 'Contar los que quedan', cientifico: 'contada por Josefina', modo: 'escuchar', pista: 'Preguntale en qué anda trabajando.',
    texto: 'Censar huemules puede llevar semanas sin ver ninguno. Es Monumento Natural en Argentina y figura en el escudo de Chile, y aun así casi nadie lo vio de cerca.' },
  { id: 'h-llaollao', seccion: 'historias', nombre: 'Lo que crece sobre el árbol', cientifico: 'contada por Josefina', modo: 'escuchar', pista: 'Preguntale por esas bolitas anaranjadas.',
    texto: 'El llao llao vive sobre lengas y coihues, les hace nudos en la madera y le dio nombre a una península del Nahuel Huapi.' },
  { id: 'h-incendio', seccion: 'historias', nombre: 'Una chispa', cientifico: 'contada por Josefina', modo: 'escuchar', pista: 'Preguntale qué es lo que más miedo le da.',
    texto: 'El bosque tarda siglos en crecer y arde en horas. Fuego solo en lugares habilitados y apagado con agua: la tierra encima no alcanza, abajo sigue vivo.' },
  { id: 'h-ramal', seccion: 'historias', nombre: 'El ramal que no cerró', cientifico: 'contada por Elsa', modo: 'escuchar', pista: 'Subite al tren y charlá con la guarda.',
    texto: 'El ramal se terminó en 1945 tras más de veinte años de obra. Lo quisieron cerrar varias veces y la gente salió a la vía a impedirlo. Hoy anda más por cariño que por necesidad.' },
  { id: 'h-nieve-tren', seccion: 'historias', nombre: 'Cuando la nieve lo para', cientifico: 'contada por Elsa', modo: 'escuchar', pista: 'Preguntale a la guarda por el invierno.',
    texto: 'La nieve tapa la vía y el tren espera con la salamandra prendida hasta que pasa la cuadrilla con las palas. Hay quien pasó la peor nevada jugando al truco con desconocidos.' },
  { id: 'h-empujar', seccion: 'historias', nombre: 'Bajarse a empujar', cientifico: 'contada por Elsa', modo: 'escuchar', pista: 'Preguntale por las cuestas largas.',
    texto: 'En las cuestas la máquina patina y hay que tirar arena sobre el riel. Los pasajeros bajaban a caminar al lado y volvían a subir en marcha, sin apurar el paso.' },
  { id: 'h-agua', seccion: 'historias', nombre: 'Parar a tomar agua', cientifico: 'contada por Elsa', modo: 'escuchar', pista: 'Preguntale para qué son los tanques de la vía.',
    texto: 'La locomotora carga agua cada tanto. Mientras tanto se aceitan las bielas y se acomoda el carbón: veinte minutos para estirar las piernas y escuchar el bosque con la máquina resoplando al lado.' },
  { id: 'h-libreta', seccion: 'historias', nombre: 'La libreta', cientifico: 'contada por Ercilia', modo: 'escuchar', pista: 'Preguntale en el almacén cómo se pagaba antes.',
    texto: 'Nadie pagaba con billetes: se anotaba todo en una libreta y se saldaba después de la esquila, cuando entraba la plata de la lana. El almacén le fiaba a todo el valle y casi nunca perdía.' },
  { id: 'h-arrieros', seccion: 'historias', nombre: 'Los que traían todo', cientifico: 'contada por Ercilia', modo: 'escuchar', pista: 'Preguntale de dónde venía la mercadería.',
    texto: 'Antes del tren, la mercadería llegaba en carros tirados por caballos, veinte días de viaje desde la costa. Se pedía en marzo lo que se iba a necesitar en agosto, y si uno se equivocaba, se aguantaba.' },
  { id: 'h-truchas', seccion: 'historias', nombre: 'Peces que vinieron en tren', cientifico: 'contada por Nicanor', modo: 'escuchar', pista: 'El pescador tiene su cabaña junto al lago.',
    texto: 'Las truchas llegaron como huevos en cajones con hielo a principios del siglo XX: barco, tren y mula hasta los lagos. La perca criolla, que sí es nativa, cada vez cuesta más encontrarla grande.' },
  { id: 'h-faro', seccion: 'historias', nombre: 'La luz del otro lado', cientifico: 'contada por Nicanor', modo: 'escuchar', pista: 'Preguntale por el faro.',
    texto: 'Una tarde el viento lo agarró lejos de la costa con el remo partido. Remó hacia la luz del faro hasta llegar. Desde entonces sale temprano y le señala el faro a todo el que ve en el agua.' },
  { id: 'h-nahuelito', seccion: 'historias', nombre: 'Lo que se ve en el agua', cientifico: 'contada por Nicanor', modo: 'escuchar', pista: 'Preguntale por el bicho del lago.',
    texto: 'Troncos hundidos que suben al cambiar la presión, cardúmenes que hacen sombra, olas que se cruzan. Nicanor nunca vio al bicho del lago, pero tampoco dice que no esté.' },
  { id: 'h-devolver', seccion: 'historias', nombre: 'Devolverla al agua', cientifico: 'contada por Nicanor', modo: 'escuchar', pista: 'Preguntale cómo devuelve las truchas.',
    texto: 'Manos mojadas, anzuelo afuera rápido y la trucha sostenida de frente a la corriente hasta que se va sola. Una grande tardó años en hacerse grande.' },

  // ---------------------------------------------------------------- lugares
  { id: 'refugio', seccion: 'lugares', nombre: 'Refugio del Arroyo', modo: 'llegar', pista: 'Donde empieza todo.', texto: 'Una cabaña de troncos con un fogón afuera. De noche, la ventana queda encendida.' },
  { id: 'muelle', seccion: 'lugares', nombre: 'Muelle del Lago', modo: 'llegar', pista: 'Bajando desde el refugio hacia el agua.', texto: 'Tablones sobre el agua quieta. Sentarse en la punta y esperar el atardecer es casi obligatorio.' },
  { id: 'puente', seccion: 'lugares', nombre: 'Puente de Troncos', modo: 'llegar', pista: 'Donde el sendero cruza el arroyo.', texto: 'Un puente viejo sobre el arroyo que baja de la cordillera hacia el lago.' },
  { id: 'mallin', seccion: 'lugares', nombre: 'Mallín', modo: 'llegar', pista: 'Un pastizal húmedo junto al arroyo.', texto: 'Pradera empapada donde el agua aflora. De noche se llena de ranitas.' },
  { id: 'mirador', seccion: 'lugares', nombre: 'Mirador del Pehuén', modo: 'llegar', pista: 'El punto más alto del sendero.', texto: 'Desde acá se ve el lago entero y, al oeste, la cordillera.' },
  { id: 'estacion', seccion: 'lugares', nombre: 'El ramal del valle', modo: 'llegar', pista: 'Seguí la vía angosta: en algún lado tiene andén.', texto: 'La vía da la vuelta al valle entero y tiene cuatro paradas: la Estación del Valle, con galpón, reloj y tanque de agua, y tres apeaderos con su andén y su refugio de tablas. En el camino cruza el arroyo por un puente de caballetes. Es trocha angosta de 75 centímetros, como la trochita que une Ingeniero Jacobacci con Esquel desde 1945 con locomotoras de 1922.' },
  { id: 'viaje', seccion: 'lugares', nombre: 'Un viaje en la trochita', modo: 'llegar', pista: 'Esperá el tren en cualquier andén y subite cuando pare.', texto: 'El tren avanza a paso de hombre, para en las cuatro paradas del anillo y cruza el arroyo por el puente de caballetes. Dicen que en las subidas los pasajeros bajaban a caminar al lado y volvían a subir más arriba, sin apurar el paso.' },
  { id: 'cascada', seccion: 'lugares', nombre: 'El salto del arroyo', modo: 'llegar', pista: 'Seguí el arroyo: se escucha antes de verse.', texto: 'Casi seis metros de caída y una poza abajo, con la espuma girando y el rocío en el aire. En los saltos el agua se carga de oxígeno, y por eso justo debajo suele haber truchas esperando lo que baja con la corriente.' },
  { id: 'cueva', seccion: 'lugares', nombre: 'Cueva de las Manos', modo: 'llegar', pista: 'Un alero de roca en una ladera empinada, lejos del sendero.', texto: 'Un alero de piedra con la pared pintada: decenas de manos en negativo y una tropilla de guanacos. Se pintaban soplando pigmento sobre la mano apoyada, con un hueso hueco, y por eso casi todas son manos izquierdas: la derecha sostenía el tubo. Las de la Cueva de las Manos, en el cañadón del río Pinturas, en Santa Cruz, tienen más de 9.000 años y son Patrimonio de la Humanidad. Abajo quedan las piedras de un fogón.' },
  { id: 'almacen', seccion: 'lugares', nombre: 'Almacén de Ramos Generales', modo: 'llegar', pista: 'El de Ercilia: vereda de tablas, cornisa alta y el cartel pintado a mano.', texto: 'El almacén de ramos generales era el centro del pueblo rural: vendía comida, herramientas, tela y kerosene, compraba lana y cueros, hacía de correo y de banco con la libreta de fiado. Muchos los abrieron inmigrantes sirios y libaneses, a los que en el campo llamaban "los turcos", que antes recorrían las estancias con la carreta cargada.' },
  { id: 'renoval', seccion: 'trueque', nombre: 'Renoval plantado', cientifico: 'plantado por vos', modo: 'cambiar', pista: 'Con un piñón o un fruto de calafate, en un claro llano.',
    texto: 'Un renoval necesita luz: por eso solo prende en los claros, donde los grandes no le tapan el sol. Tarda dos semanas en levantar del brote al arbolito, y bastante más en hacerse árbol. Se planta con la tecla B.' },
  { id: 'piezas', seccion: 'trueque', nombre: 'Lo que le colgás alrededor', cientifico: 'armado por vos', modo: 'cambiar', pista: 'Con C, elegí banco, fogón, tendal o pila de leña.',
    texto: 'Un puesto no es solo las paredes: es el banco donde te sentás, el fogón de piedra, el tendal con la ropa al viento y la leña apilada al reparo. Eso es lo que lo vuelve tuyo.' },
  { id: 'carpa', seccion: 'trueque', nombre: 'Carpa de lona', cientifico: 'armada con la manta', modo: 'cambiar', pista: 'Con la manta del almacén se puede armar donde quieras.',
    texto: 'Dos aguas de lona encerada, tensores y la manta adentro. Armada en un lugar llano y seco sirve para pasar la noche donde te agarre: se arma y se levanta con la tecla T.' },
  { id: 'tronco-mat', seccion: 'trueque', nombre: 'Troncos', cientifico: 'hechos con el hacha', modo: 'cambiar', pista: 'Talá un árbol con el hacha: tres hachazos (H).',
    texto: 'Un coihue o una lenga, tres hachazos y abajo: cuatro troncos para tirantes y paredes. El pehuén no se toca. Un tronco aserrado a mano da dos tablas; en un banco de carpintero, cuatro.' },
  { id: 'tabla-mat', seccion: 'trueque', nombre: 'Tablas', cientifico: 'aserradas en el galpón', modo: 'cambiar', pista: 'Aserrá un tronco con Y.',
    texto: 'Con el hacha y paciencia, un tronco da dos tablas en cualquier lado. En el banco del galpón, o en uno que te armes con troncos y piedra, rinde cuatro. Las tablas son el piso y el techo.' },
  { id: 'piedra-mat', seccion: 'trueque', nombre: 'Piedra', cientifico: 'juntada con el hacha', modo: 'cambiar', pista: 'De los pedreros de la altura.',
    texto: 'La piedra va abajo de todo: sobre ella se apoyan las esquinas para que la madera no toque la tierra y no se pudra. Con ocho alcanza para los cimientos de un puesto.' },
  { id: 'hacha', seccion: 'trueque', nombre: 'Hacha de mano', cientifico: 'cambiada en el almacén', modo: 'cambiar', pista: 'Se cambia por cantos rodados y ramitas.',
    texto: 'Cabeza de acero y cabo de lenga. Con ella se hacen troncos de los árboles caídos —nunca de los que están en pie— y se junta piedra de los pedreros. Es lo primero que hace falta para levantar algo.' },
  { id: 'puesto-propio', seccion: 'trueque', nombre: 'Tu propio puesto', cientifico: 'levantado por vos', modo: 'cambiar', pista: 'Elegí un claro llano con C y levantalo por etapas.',
    texto: 'Cimientos de piedra, piso de tablas, paredes de tronco a media madera y techo de dos aguas. Así se levanta un puesto en la Patagonia: con lo que hay a la vuelta y sin apurarse. Adentro entra un catre, y de noche se duerme.' },
  { id: 'mosca', seccion: 'trueque', nombre: 'Mosca de pescar', cientifico: 'cambiada en el almacén', modo: 'cambiar', pista: 'Se cambia por calafate y plumas.', texto: 'Atada a mano con pluma de carpintero. Con esta mosca los piques llegan casi en la mitad de tiempo.' },
  { id: 'farol', seccion: 'trueque', nombre: 'Farol de kerosene', cientifico: 'cambiado en el almacén', modo: 'cambiar', pista: 'Se cambia por cantos rodados y ramitas.', texto: 'De bronce y vidrio, como los que colgaban en los boliches de campo. Alumbra mucho más lejos que una linterna.' },
  { id: 'manta', seccion: 'trueque', nombre: 'Manta de lana', cientifico: 'cambiada en el almacén', modo: 'cambiar', pista: 'Se cambia por piñones y frutillas.', texto: 'Hilada y tejida en telar con los grises naturales de la oveja. Con ella encima se puede dormir en cualquier lado, sin fuego.' },
  // 2.1: lo que se consigue con las conservas
  { id: 'grabador', seccion: 'trueque', nombre: 'Grabador de mano', cientifico: 'cambiado en el almacén', modo: 'cambiar', pista: 'Se cambia por dos frascos de dulce de frutilla y dos plumas.', texto: 'Un grabador de casete de los que usaban los guardaparques para los censos de aves. Grabás el canto de un ave que ya anotaste y, al hacerlo sonar, la más cercana contesta: algunas se acercan a ver quién anda en su territorio.' },
  { id: 'botas', seccion: 'trueque', nombre: 'Botas de goma', cientifico: 'cambiadas en el almacén', modo: 'cambiar', pista: 'Se cambian por calafates secos y llao llao seco.', texto: 'Altas, de goma negra, de las que usan los pescadores de río. Con ellas cruzás el arroyo sin chapotear: los animales de la orilla casi no te oyen.' },
  { id: 'yerba', seccion: 'trueque', nombre: 'Yerba con palo', cientifico: 'cambiada en el almacén', modo: 'cambiar', pista: 'Se cambia por frutillas y cantos rodados.', texto: 'En paquete de papel. Alcanza para cebar unos cuantos mates en cualquier fuego del bosque.' },
  { id: 'semillas-habas', seccion: 'trueque', nombre: 'Semillas de habas', cientifico: 'cambiadas en el almacén', modo: 'cambiar', pista: 'Ercilia las cambia por calafates y ramitas.', texto: 'Habas secas de la cosecha pasada, en un cucurucho de papel de diario. Cada una es una siembra.' },
  { id: 'semillas-papa', seccion: 'trueque', nombre: 'Papa para semilla', cientifico: 'cambiada en el almacén', modo: 'cambiar', pista: 'Ercilia la cambia por piñones y un canto rodado.', texto: 'Papas chicas con los ojos ya brotados. Se entierran enteras o en pedazos, siempre con un ojo.' },
  { id: 'tijera', seccion: 'trueque', nombre: 'Tijera de esquilar', cientifico: 'cambiada en el almacén', modo: 'cambiar', pista: 'Ercilia la cambia por cantos rodados y una pluma.', texto: 'De hoja doble y resorte. Las comparsas de esquila recorrían las estancias en primavera con sus tijeras; hoy casi todo se esquila a máquina, pero en los puestos chicos todavía se usa esta.' },
  { id: 'galpon', seccion: 'lugares', nombre: 'Galpón de Esquila', modo: 'llegar', pista: 'Un galpón largo de chapa, con corrales de palo a pique.', texto: 'Galpón de esquila con sus tablas, la prensa de lana y los fardos apilados. Afuera, los corrales de palo a pique, la manga que lleva a la rampa, una pirca de piedra de un corral más viejo y el molino australiano que llena el tanque. Entre 1880 y 1950 la lana movió la Patagonia: las comparsas de esquiladores recorrían las estancias de campo en campo, y en un galpón como este trabajaban veinte personas de sol a sol.' },
  { id: 'molino', seccion: 'lugares', nombre: 'Molino de Viento', modo: 'llegar', pista: 'Se ve de lejos: las aspas giran con el viento.', texto: 'Base de piedra en ocho caras, torre encalada y capucha de madera. Se entra por la puerta y se sube por veinticuatro peldaños pegados a la pared hasta el entrepiso, donde están las dos muelas: la de abajo fija y la de arriba girando, movida por el árbol central y la rueda dentada que baja de las aspas. Arriba, la tolva por donde se echa el grano; abajo, las bolsas donde cae la harina. Un molino así muele entre cincuenta y cien kilos por hora con buen viento.' },
  { id: 'casa-te', seccion: 'lugares', nombre: 'Casa de Té', modo: 'llegar', pista: 'Una casa de madera con galería y mesas afuera, donde la pava está siempre al fuego.', texto: 'Una casa de madera con galería, mesas al aire libre y la pava siempre al fuego. Las casas de té de la Patagonia vienen de la colonia galesa del Chubut, donde la torta negra se sirve desde hace más de un siglo.' },
  { id: 'torre', seccion: 'lugares', nombre: 'Torre de Guardaparques', modo: 'llegar', pista: 'Arriba, entre los árboles: una torre de madera con escalera.', texto: 'Torre de vigilancia contra incendios. Desde arriba se controla el humo en kilómetros a la redonda; en verano alguien pasa el día entero mirando el horizonte.' },
  { id: 'bitacora', seccion: 'historias', nombre: 'La bitácora del farero', cientifico: 'leída en la sala de la linterna', modo: 'escuchar', pista: 'Subí los cuarenta y dos peldaños y mirá la mesa.',
    texto: 'Hojas llenas de una letra pareja: la hora en que se prendió la lámpara, la que se apagó, el viento, la visibilidad, los barcos que pasaron. Entre las anotaciones, una del 14 de julio: "Nevó toda la noche. Subí cada dos horas a limpiar el vidrio. No pasó nadie, pero la luz estuvo." Los fareros de los lagos del sur llevaban cuadernos así durante décadas.' },
  { id: 'faro', seccion: 'lugares', nombre: 'Faro del Lago', modo: 'llegar', pista: 'Se ve girar de noche, del otro lado del agua.', texto: 'Una torre a franjas en la punta más lejana del lago. De noche su haz da vueltas y sirve para ubicarse desde cualquier orilla.' },
  { id: 'cabana', seccion: 'lugares', nombre: 'Cabaña del Pescador', modo: 'llegar', pista: 'A orillas del lago, lejos del refugio.', texto: 'Una cabaña chica con los remos apoyados contra la pared y leña apilada. La chimenea humea casi siempre.' },
  { id: 'puesto', seccion: 'lugares', nombre: 'Puesto Alto', modo: 'llegar', pista: 'Arriba de todo, del lado de la cordillera.', texto: 'El refugio más alto del valle, mirando al lago. Desde el banco de afuera se ve todo el bosque de un lado al otro.' },
  { id: 'arrayanes', seccion: 'lugares', nombre: 'Bosque de Arrayanes', modo: 'llegar', pista: 'Del otro lado del lago.', texto: 'Troncos canela que brillan con la luz de la tarde, a orillas del lago.' },
];

// 1.10: las cartas que trae la trochita. Se leen en el almacén y quedan acá enteras.
for (const c of CARTAS) {
  ENTRADAS.push({ id: c.id, seccion: 'cartas', nombre: c.de, cientifico: 'carta', modo: 'leer',
    pista: 'Llega con la trochita a la Estación del Valle; la guarda Ercilia en el almacén.', texto: c.texto.join(' ') });
}
// 1.11: la cocina de a dos, y la harina del almacén.
ENTRADAS.push(
  { id: 'guiso-campo', seccion: 'recetas', nombre: 'Guiso de papas y habas', modo: 'cocinar', pista: 'Dos papas y dos puñados de habas, al fuego.',
    texto: 'Lo que hay en la huerta, todo junto en una olla y a esperar. Es la comida de los días de lluvia: rinde, calienta y se come de a poco, con pan si hay.' },
  { id: 'tortilla-papas', seccion: 'recetas', nombre: 'Tortilla de papas', modo: 'cocinar', pista: 'Dos huevos del gallinero y dos papas.',
    texto: 'Las papas en rodajas finas, primero en la grasa y después con el huevo batido encima. La vuelta con el plato es lo difícil: sale o no sale, y si no sale igual se come.' },
  { id: 'torta-frita', seccion: 'recetas', nombre: 'Torta frita', modo: 'cocinar', pista: 'Harina del almacén y un huevo.',
    texto: 'La de los días de lluvia en toda la Patagonia: masa de harina estirada, con un agujero en el medio, frita en grasa bien caliente. Se come con mate, y si llueve, más.' },
  { id: 'harina', seccion: 'trueque', nombre: 'Un kilo de harina', cientifico: 'cambiada en el almacén', modo: 'cambiar', pista: 'Ercilia la cambia por piñones y un canto rodado.',
    texto: 'Harina de trigo en bolsa de papel. Alcanza para cuatro tortas fritas.' },
);
// 1.11: las visitas.
ENTRADAS.push({ id: 'visita', seccion: 'historias', nombre: 'Una visita a la tarde', cientifico: 'los vecinos se turnan', modo: 'escuchar', pista: 'Armá una mesa de campo con dos asientos alrededor y esperá una tarde.',
  texto: 'En el campo nadie avisa que viene: se ve la mesa puesta, se ve el humo, y se pasa. Se toma algo, se cuenta cómo anda el lago o la majada, y nunca se llega con las manos vacías.' });
// 1.11: rastrear con el perro.
ENTRADAS.push({ id: 'rastreo', seccion: 'fauna', nombre: 'Seguir un rastro', cientifico: 'con el perro', modo: 'observar', pista: 'Mirá al perro de cerca y apretá E.',
  texto: 'El perro lee el piso como uno lee una carta: por dónde pasó alguien, hace cuánto y si iba apurado. Con paciencia te lleva hasta el pudú escondido en la quila o la liebre agachada entre los coirones.' });
// 1.11: la feria de la estación.
ENTRADAS.push({ id: 'feria', seccion: 'lugares', nombre: 'La feria de la estación', cientifico: 'cada cinco días', modo: 'llegar', pista: 'Cada cinco días, de nueve a seis, junto al andén de la Estación del Valle.',
  texto: 'Los días de feria bajan del tren quinteros, leñeros y almaceneros de los pueblos de la línea y arman sus puestos junto al andén. Se cambia lo que sobra por lo que falta: la moneda es lo que cada uno produce.' });
// 1.11: el telar.
ENTRADAS.push({ id: 'poncho', seccion: 'huerta', nombre: 'Poncho tejido', cientifico: 'del telar', modo: 'cosechar', pista: 'Armá un telar (O → Trabajo) y tejé con tres vellones.',
  texto: 'Un rectángulo de lana con una abertura para la cabeza, y sin embargo abriga como nada: corta el viento, aguanta la llovizna y de noche es manta. Cada tejedora tiene su guarda, y por la guarda se sabe de dónde es.' });
// 1.11: el gallinero.
ENTRADAS.push(
  { id: 'huevo', seccion: 'huerta', nombre: 'Huevos', cientifico: 'del gallinero', modo: 'cosechar', pista: 'Armá un gallinero (O → Trabajo) y juntalos con E.',
    texto: 'Las gallinas de campo ponen de día, en el nidal que les toca, y si no se los juntás se echan encima. Un huevo fresco de casa tiene la yema casi naranja: comen de todo lo que encuentran picoteando.' },
  { id: 'gallina', seccion: 'fauna', nombre: 'Gallina de campo', cientifico: 'Gallus gallus domesticus', modo: 'observar', pista: 'Vienen con el gallinero.',
    texto: 'No hay puesto sin gallinas. Andan sueltas de día, picoteando bichos y semillas alrededor de la casa, y a la tarde se meten solas en el gallinero: saben la hora mejor que uno.' },
);
// 1.10: el rayo, con los fenómenos del cielo.
ENTRADAS.push({ id: 'rayo', seccion: 'cielo', nombre: 'El rayo', cientifico: 'descarga eléctrica', modo: 'observar', pista: 'En una tormenta fuerte, alguno cae cerca.',
  texto: 'La descarga busca lo más alto y lo parte de arriba abajo: el agua de adentro del tronco hierve de golpe y lo abre. El árbol no se pierde: se hace leña, y del tocón vuelve a brotar.' });
// 1.10: el zaino de Don Ramón.
ENTRADAS.push({ id: 'caballo', seccion: 'fauna', nombre: 'Caballo criollo', cientifico: 'Equus caballus · el zaino de Don Ramón', modo: 'observar', pista: 'Don Ramón te lo presta cuando ya caminaste el valle.',
  texto: 'El criollo es chico, rústico y aguantador: baja de los caballos que trajeron los españoles y se hizo solo en la pampa y la meseta, a fuerza de frío y de pasto duro. En la Patagonia todo se movió a caballo hasta que llegaron el tren y la ruta.' });
ENTRADAS.push({ id: 'e-caballo', seccion: 'encargos', nombre: 'El zaino', cientifico: 'encargo de Don Ramón', modo: 'encargo', pista: 'Don Ramón te lo ofrece cuando ya caminaste las cuatro puntas.',
  texto: 'Dos vellones para el pelero, la manta que va entre el lomo y la montura. Sin pelero, al caballo le paspa el lomo.' });
// Los encargos de Ercilia, que llegan por carta.
ENTRADAS.push(
  { id: 'e-correo', seccion: 'encargos', nombre: 'Contestar las cartas', cientifico: 'encargo de Ercilia', modo: 'encargo', pista: 'Ercilia te lo pide cuando te llegue la primera carta.',
    texto: 'El correo llega con el tren y se va con el tren. Cuatro cartas leídas, y la gente de allá deja de preocuparse.' },
  { id: 'e-verdura', seccion: 'encargos', nombre: 'Verdura para el pueblo', cientifico: 'encargo de Ercilia', modo: 'encargo', pista: 'Llega con una carta de Esquel, cuando tengas un cantero.',
    texto: 'Seis habas y cuatro papas para Rosa, en Esquel, que las recibe con el tren. Se paga en semilla buena.' },
  { id: 'e-lana', seccion: 'encargos', nombre: 'Lana para Amalia', cientifico: 'encargo de Ercilia', modo: 'encargo', pista: 'Llega con una carta de Jacobacci, cuando hayas visto la majada.',
    texto: 'Seis vellones enteros para Amalia, la del telar. La lana del sur, dice, es la mejor que hay.' },
);
// ---------------------------------------------------------------- 2.3
// La colmena y el ahumadero.
ENTRADAS.push(
  { id: 'miel', seccion: 'huerta', nombre: 'Miel', cientifico: 'de tu colmena', modo: 'cosechar', pista: 'Armá una colmena (O → Trabajo) cerca de la huerta y esperá unos días de sol.',
    texto: 'Las abejas salen con sol y calor, y vuelven cargadas de todo lo que florece: el notro, el amancay, la rosa mosqueta, lo que sembraste. Por eso la miel de cada valle sabe distinta. En invierno no salen: se quedan apretadas adentro, calentándose entre ellas.' },
  { id: 'trucha-fresca', seccion: 'huerta', nombre: 'Trucha para ahumar', cientifico: 'dos por día', modo: 'cosechar', pista: 'Con un ahumadero armado, de lo que pescás te quedás con dos truchas por día.',
    texto: 'Las truchas no son de acá: llegaron en tren, en tachos con hielo, hace más de cien años. Se llevan pocas —el permiso de pesca de la zona pide devolver casi todo—, y las nativas, la perca y el pejerrey, vuelven siempre al agua.' },
  { id: 'trucha-ahumada', seccion: 'huerta', nombre: 'Trucha ahumada', cientifico: 'del ahumadero', modo: 'cosechar', pista: 'Colgá truchas en el ahumadero con un tronco de leña y esperá medio día.',
    texto: 'Abierta, con sal gruesa, y colgada horas sobre un fuego chico de leña que casi no hace llama: lo que la cura es el humo. Así se guardaba el pescado en los puestos del sur, para cuando el lago se ponía bravo.' },
  { id: 'sopaipillas-miel', seccion: 'recetas', nombre: 'Sopaipillas con miel', modo: 'cocinar', pista: 'Harina del almacén y un frasco de miel, al fuego.',
    texto: 'Masa de harina estirada, cortada en rombos y frita hasta que se infla. Con un chorro de miel encima no duran nada en el plato.' },
  { id: 'trucha-papas', seccion: 'recetas', nombre: 'Trucha ahumada con papas', modo: 'cocinar', pista: 'Una trucha ahumada y dos papas del cantero.',
    texto: 'La trucha desmenuzada sobre papas hervidas, con un poco de grasa. Comida de invierno, de las que se hacen con lo que se guardó en verano.' },
);
// ---------------------------------------------------------------- 2.4
// El horno de barro: lo horneado se guarda y se lleva a la feria.
ENTRADAS.push(
  { id: 'pan-casero', seccion: 'recetas', nombre: 'Pan casero', modo: 'cocinar', pista: 'Dos medidas de harina del almacén y un tronco, en el horno de barro.',
    texto: 'El horno se calienta con leña hasta que la cúpula queda blanca; después se barren las brasas y entra el pan. Sale con la corteza dura y adentro tibio, y dura días envuelto en un trapo.' },
  { id: 'empanadas', seccion: 'recetas', nombre: 'Empanadas', modo: 'cocinar', pista: 'Harina del almacén, un huevo y una papa del cantero, en el horno de barro.',
    texto: 'Masa de harina y grasa, rellena de lo que haya: acá, papa y huevo. En el horno de barro se doran parejas. Se llevan envueltas para el trabajo, y la cuadrilla de la vía las cambia por lo que sea.' },
);
// El vivero: las semillas que se juntan en otoño y los plantines que salen.
for (const [esp, nombre, cientifico, texto] of [
  ['coihue', 'coihue', 'Nothofagus dombeyi', 'Nuececillas diminutas, de a tres dentro de una cúpula con escamas. Un coihue grande larga miles, y casi ninguna llega a árbol: por eso en el vivero se cuida cada una.'],
  ['lenga', 'lenga', 'Nothofagus pumilio', 'La lenga semilla fuerte cada unos años y flojo los demás: los años buenos el suelo del bosque queda alfombrado. Germina mejor si pasó un invierno bajo la nieve.'],
  ['nire', 'ñire', 'Nothofagus antarctica', 'El ñire crece donde los otros no pueden: en los mallines, en el borde de la estepa, en las laderas quemadas. Por eso es el primero que vuelve después de un incendio.'],
  ['cipres', 'ciprés', 'Austrocedrus chilensis', 'Conitos chicos que se abren al secarse y sueltan semillas con un ala, para que el viento las lleve. El ciprés crece lento: un plantín de dos palmos puede tener cinco años.'],
]) {
  ENTRADAS.push({ id: `semilla-${esp}`, seccion: 'frutos', nombre: `Semilla de ${nombre}`, cientifico, modo: 'juntar', pista: `En otoño, junto a un ${nombre} grande, E la junta.`, texto });
}
for (const [esp, nombre] of [['coihue', 'coihue'], ['lenga', 'lenga'], ['nire', 'ñire'], ['cipres', 'ciprés'], ['pehuen', 'pehuén']]) {
  ENTRADAS.push({ id: `plantin-${esp}`, seccion: 'huerta', nombre: `Plantín de ${nombre}`, cientifico: 'del vivero', modo: 'cosechar',
    pista: 'Sembrá semillas en el vivero (O → Trabajo) y esperá tres días.',
    texto: `Un ${nombre} de dos palmos, con las primeras hojas verdaderas. Plantado en un claro con B, en una semana ya se para solo.` });
}
// 3.7.2 (granja): la leche, las carnes y los chorizos, la fruta, los fardos, los plantines de frutal y los animales (ver granja.js)
ENTRADAS.push(...ENTRADAS_GRANJA);
// Los cuentos del fogón, y lo que asoma en el lago.
for (const c of CUENTOS) {
  ENTRADAS.push({ id: c.id, seccion: 'fogon', nombre: c.titulo, cientifico: `contado al fogón`, modo: 'escuchar',
    pista: 'Cuando un vecino venga de visita, prendé un fuego cerca de la mesa y hablale de noche.', texto: c.partes.join(' ') });
}
ENTRADAS.push({ id: 'avistaje-lago', seccion: 'fogon', nombre: 'Lo que asomó en el lago', cientifico: 'una noche de luna', modo: 'observar',
  pista: 'Después de oír las historias del lago, una noche clara, desde la orilla. Hay que tener suerte.',
  texto: 'Un lomo oscuro, largo, que salió del agua quieta, se quedó un momento y se hundió sin hacer ruido. Puede haber sido un tronco que subió con la presión, o un cardumen, o una ola cruzada. Nicanor diría que el lago es hondo y guarda lo suyo.' });
// 3.6: la Aldea de los Duendes (sólo en el Relax: en el Desafío la parada del sur sigue chica)
ENTRADAS.push({ id: 'aldea', seccion: 'lugares', nombre: 'Aldea de los Duendes', cientifico: 'la parada del sur', modo: 'llegar', pista: 'La trochita para en un pueblito escondido, al sur del valle.',
  texto: 'Un pueblo chico al costado de la vía: la estación, la plaza con un duende tallado en un tronco, el almacén de ramos generales y unas pocas casas de chapa y tablas. Los vecinos dicen que el nombre viene de las puertitas talladas que encontraron los peones en las raíces de los coihues cuando tendieron las vías. Al que baja del tren a quedarse, entre todos le levantan el local.' });
// 3.6 (mecánicas): lo que se lee y se escucha en la aldea (ver aldea-lecturas.js y aldea-mecanicas.js)
ENTRADAS.push({ id: PLACA_DUENDE.id, seccion: 'pueblo', nombre: PLACA_DUENDE.titulo, cientifico: 'la plaquita de la plaza', modo: 'observar',
  pista: 'En la plaza de la aldea, al pie del duende tallado, hay una plaquita para leer.', texto: PLACA_DUENDE.partes.join(' ') });
for (const l of LIBROS_ALDEA) {
  ENTRADAS.push({ id: l.id, seccion: 'pueblo', nombre: l.titulo, cientifico: l.de, modo: 'libro',
    pista: 'Sentate a una mesa de lectura de la biblioteca de la aldea y abrí un libro, o pedilo prestado en el mostrador.', texto: l.partes.join(' ') });
}
ENTRADAS.push({ id: CUENTOS_DOMINGO.id, seccion: 'pueblo', nombre: CUENTOS_DOMINGO.titulo, cientifico: 'con la abuela Herminia', modo: 'escuchar',
  pista: 'El domingo a las diez, en la biblioteca de la aldea: sentate y escuchá a la abuela hasta el final.', texto: CUENTOS_DOMINGO.texto });
export const ENTRADA = Object.fromEntries(ENTRADAS.map((e) => [e.id, e]));
