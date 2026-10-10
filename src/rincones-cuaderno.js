// 3.7.5 (rincones): lo que va al cuaderno de los rincones de la aldea: los doce duendes escondidos (figuritas talladas
// en madera, escondidas por el valle y la aldea: nada mágico, son tallas de los viejos de la aldea), la talla del
// jugador en la plaza, el cuaderno en la biblioteca, el potrero, la huerta comunitaria, los títeres, el fuerte y el
// campamento. Es un módulo de datos sin imports (cuaderno.js lo suma a ENTRADAS sin armar un círculo con aldea.js).
//
// Los duendes NO son los de la 3.8 (PLAN_3_8.md: los duendes que salen de noche en el Desafío). Acá son la tradición
// de la aldea en el Relax: tallas de madera que dejaron los peones que tendieron la vía, una por rincón. La abuela
// Herminia cuenta que eran doce y que el que las encuentra a todas "queda en la leyenda".

// `donde`: cómo se ubica (lo resuelve rincones.js con el terreno): { lugar, dx, dz } cerca de un lugar fijo del valle
// (config.js o el terreno: refugio, muelle, puente, mallín, mirador, arrayanes, salto de agua), o { aldea: [lx, lz] } en
// el plano de la aldea (y `piso`: adentro de ese edificio, sobre su piso).
export const DUENDES = [
  { id: 'duende-lenera', nombre: 'El duende de la leñera', donde: { lugar: 'refugio', dx: 11.5, dz: -4 },
    pista: 'Uno vigila la leña del refugio, del lado donde pega la tarde.',
    texto: 'Tallado en un nudo de ciprés, con el gorro torcido y una astilla en la mano. Mira para el lado donde se apila la leña, como contándola.' },
  { id: 'duende-muelle', nombre: 'El duende del muelle', donde: { lugar: 'muelle', dx: 0, dz: 0, orilla: true },
    pista: 'Al pie del muelle del lago, donde empiezan los tablones.',
    texto: 'Lleva una cañita y una trucha de madera tan grande como él. La humedad del lago le dejó la barba verde de musgo.' },
  { id: 'duende-puente', nombre: 'El duende del puente', donde: { lugar: 'puente', dx: 0, dz: 0, cabecera: true },
    pista: 'En una cabecera del Puente de Troncos, mirando pasar el río.',
    texto: 'Sentado sobre una piedra con las piernas colgando. Dicen que lo pusieron los que cortaron los troncos del puente, para que el río no se los llevara.' },
  { id: 'duende-mallin', nombre: 'El duende del mallín', donde: { lugar: 'mallin', dx: 6, dz: 5 },
    pista: 'En el mallín, sobre una piedra seca entre el pasto húmedo.',
    texto: 'Tiene las botas altas y un ramito de juncos. Es el único que mira para abajo, buscando ranitas.' },
  { id: 'duende-pehuen', nombre: 'El duende del pehuén', donde: { lugar: 'mirador', dx: -5, dz: 4 },
    pista: 'Arriba, en el Mirador del Pehuén, al reparo del árbol viejo.',
    texto: 'Tallado en una piña de pehuén: tiene piñones de botones. Es el más viejo de todos; la abuela dice que ya estaba cuando ella era chica.' },
  { id: 'duende-arrayan', nombre: 'El duende de los arrayanes', donde: { lugar: 'arrayanes', dx: -4, dz: 6 },
    pista: 'Entre los troncos color canela del bosque de arrayanes.',
    texto: 'Pintado de canela, como los troncos, y por eso cuesta tanto verlo. Tiene una flor blanca de arrayán en el gorro.' },
  { id: 'duende-salto', nombre: 'El duende del salto', donde: { lugar: 'salto', dx: 0, dz: 0, orilla: true },
    pista: 'Junto al salto de agua, donde el arroyo hace ruido.',
    texto: 'Con la boca abierta, como gritando para que lo oigan por encima del agua. Tiene las mejillas pulidas por la llovizna del salto.' },
  { id: 'duende-anden', nombre: 'El duende del andén', donde: { aldea: [-9.6, 8.4] },
    pista: 'En la estación de la aldea, en una punta del andén.',
    texto: 'Con gorra de guarda y un banderín. Lo hizo Ernesto con la madera de un durmiente viejo: dice que es el jefe de estación de verdad.' },
  { id: 'duende-biblioteca', nombre: 'El duende de la biblioteca', donde: { aldea: [-14.6, 38.2], piso: 'biblioteca' },
    pista: 'Adentro de la biblioteca popular, cerca de los almohadones de los cuentos.',
    texto: 'Leyendo un libro más grande que él. Los chicos le cambian de lugar las hojas de papel que le ponen entre las manos.' },
  { id: 'duende-escuela', nombre: 'El duende de la escuela', donde: { aldea: [-4.5, 76.7] },
    pista: 'Al costado de la escuela, del lado de la calle.',
    texto: 'Con un guardapolvo pintado de blanco y una tiza en la mano. Nahuel jura que a la mañana está en otro lugar.' },
  { id: 'duende-casa-te', nombre: 'El duende de la casa de té', donde: { aldea: [32.4, 30.2] },
    pista: 'Por la casa de té de las galesas, del lado que da a la estafeta.',
    texto: 'Con una tetera y una taza, tallado con cuidado de galés. Ceinwen le pone una miguita de torta los domingos.' },
  { id: 'duende-loma', nombre: 'El duende de la loma', donde: { aldea: [-133.4, 47.2] },
    pista: 'Arriba de la calle de la Loma, junto al observatorio.',
    texto: 'Mirando para arriba, con un catalejo de madera. Valentina dice que lo talló alguien que ya contaba estrellas mucho antes que ella.' },
];
export const IDS_DUENDES = DUENDES.map((d) => d.id);

// Las entradas del cuaderno (sección «De la aldea»): los doce duendes y los rincones que se descubren.
export const ENTRADAS_RINCONES = [
  ...DUENDES.map((d) => ({ id: d.id, seccion: 'pueblo', nombre: d.nombre, cientifico: 'figurita tallada', modo: 'observar', pista: d.pista, texto: d.texto })),
  { id: 'duendes-todos', seccion: 'pueblo', nombre: 'Los doce duendes', cientifico: 'la leyenda completa', modo: 'observar',
    pista: 'La abuela Herminia dice que los duendes tallados eran doce. Encontralos a todos.',
    texto: 'Los doce, uno por rincón. Dicen los viejos que los tallaron los peones que tendieron la vía, para que el valle no los olvidara. El que los encuentra a todos queda en la leyenda: Tito talla su figura para la plaza.' },
  { id: 'talla-propia', seccion: 'pueblo', nombre: 'Tu talla en la plaza', cientifico: 'tallada por Tito Arrieta', modo: 'observar',
    pista: 'Al que encuentra los doce duendes, la aldea le hace un lugar en la plaza.',
    texto: 'Una figura de madera, de tu tamaño de verdad, al lado del duende viejo de la plaza: con la mochila, el cuaderno abajo del brazo y el sombrero un poco torcido. Los chicos le ponen flores en el bolsillo.' },
  { id: 'cuaderno-biblioteca', seccion: 'pueblo', nombre: 'Tu cuaderno en la biblioteca', cientifico: 'una copia en el atril', modo: 'observar',
    pista: 'Cuando tu cuaderno esté bien lleno, la biblioteca popular le hace un lugar.',
    texto: 'Una copia de tu cuaderno de campo, pasada en limpio por la abuela y los chicos, en un atril de la biblioteca popular. Los vecinos la leen y te dicen qué les gustó.' },
  { id: 'potrero', seccion: 'lugares', nombre: 'El potrero', cientifico: 'pasando la pescadería', modo: 'llegar',
    pista: 'Al final de la calle de la Vía, pasando la pescadería, hay un potrero con dos arcos de palo.',
    texto: 'Un potrero de pasto pelado con dos arcos de palo de lenga. Los arcos los hizo Tito; la pelota es de cuero cosido por Pocha. Los partidos los arman los chicos y se suma el que pasa.' },
  { id: 'gol-potrero', seccion: 'pueblo', nombre: 'Gol en el potrero', cientifico: 'un picado con los chicos', modo: 'observar',
    pista: 'Armá un picado en el potrero y metela.',
    texto: 'El grito de gol se oye hasta la plaza. Nahuel festeja como si fuera la final; Lucía anota el resultado en su cuaderno, con la fecha.' },
  { id: 'huerta-comunitaria', seccion: 'huerta', nombre: 'La huerta comunitaria', cientifico: 'al final de la calle Norte', modo: 'llegar',
    pista: 'Al final de la calle Norte, la aldea tiene una huerta de todos.',
    texto: 'Cuatro canteros con cerco de palo, que trabaja el que pasa. Lo que se cosecha se reparte: una parte para el que trabajó y el resto para la mesa de todos.' },
  { id: 'huerta-chicos', seccion: 'huerta', nombre: 'La huerta de los chicos', cientifico: 'detrás de la escuela', modo: 'observar',
    pista: 'Los chicos tienen dos canteros detrás de la escuela. A veces necesitan una mano.',
    texto: 'Dos canteros con carteles pintados a mano: «Frutillas de Lucía» y «Calafates de Nahuel». La maestra les enseña a esperar.' },
  { id: 'titeres', seccion: 'pueblo', nombre: 'Función de títeres', cientifico: 'el retablo de la plaza', modo: 'observar',
    pista: 'En la plaza hay un retablo de títeres. A la tardecita, los chicos esperan una función.',
    texto: 'El retablo lo hizo Tito y los títeres los cosió Pocha: un zorro, un pudú y un duende. Las funciones las inventás vos, y los chicos se ríen igual.' },
  { id: 'fuerte-bosque', seccion: 'lugares', nombre: 'El fuerte del bosque', cientifico: 'detrás de la calle de la Loma', modo: 'observar',
    pista: 'Los chicos quieren un fuerte en el bosque, detrás de la calle de la Loma. Les falta quien les dé una mano.',
    texto: 'Un fuerte de palos y ramas entre los coihues, con techo de colihue, una bandera hecha con una media y una contraseña que cambia todos los días.' },
  { id: 'campamento', seccion: 'lugares', nombre: 'Campamento con los chicos', cientifico: 'al lado del fuerte', modo: 'observar',
    pista: 'Con tus hijos ya grandecitos, una noche de campamento al lado del fuerte del bosque.',
    texto: 'Una carpa, un fogón chico y las estrellas entre las copas. Los chicos se duermen tarde, contando lo que oyen en el bosque.' },
  { id: 'casa-propia', seccion: 'lugares', nombre: 'Tu casa en la aldea', cientifico: 'en la calle de la Loma', modo: 'observar',
    pista: 'En la calle de la Loma queda un lote libre. Con amigos en la aldea y el material, se levanta tu casa.',
    texto: 'Una casa de tablas y chapa, con su estufa y su galería, en la calle de la Loma. La levantaron entre todos, como se hace en la aldea.' },
  { id: 'camino-aldea', seccion: 'lugares', nombre: 'El camino a la aldea', cientifico: 'del refugio a la estación', modo: 'llegar',
    pista: 'Hay una huella que va del refugio a la aldea, cruzando el bosque y la vía.',
    texto: 'Una huella de carro que va del refugio a la Aldea de los Duendes. Con la minga se emparejó, se le echó ripio y se plantaron faroles.' },
  { id: 'sulky', seccion: 'lugares', nombre: 'El sulky', cientifico: 'hecho por Tito Arrieta', modo: 'observar',
    pista: 'Con caballo propio, Tito te puede hacer un sulky para ir por el camino a la aldea.',
    texto: 'Un sulky de dos ruedas altas, con el asiento de lenga y las varas de coihue. Tirado por tu caballo, va solo por el camino: ya lo conoce.' },   // 3.8.4: sin «el zaino» (puede tener otro nombre o pelaje)
  { id: 'taller-refugio', seccion: 'lugares', nombre: 'El taller del refugio', cientifico: 'lo que te enseñaron tus amigos', modo: 'observar',
    pista: 'Cuando un amigo de la aldea te enseñe su oficio, armás un banco de trabajo al lado del refugio.',
    texto: 'Un banco de trabajo bajo el alero del refugio, con sus herramientas colgadas y un estante con lo que fuiste haciendo. Cada cosa tiene detrás a alguien que te enseñó.' },
];
