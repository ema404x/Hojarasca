// 3.6 (mecánicas): lo que se lee en la Aldea de los Duendes. Sólo datos, sin imports (lo usan
// cuaderno.js y aldea-mecanicas.js sin armar un círculo).
//   · LIBROS_ALDEA: los libros de la Biblioteca Popular. Leyendas patagónicas contadas con
//     respeto, la historia del valle, del ferrocarril y de la gente que llegó, y la flora y la
//     fauna. Cada uno, una página corta en dos o tres partes (se leen con E, como una charla).
//     Nada religioso (pedido del usuario): ni dioses, ni templos, ni curas.
//   · PLACA_DUENDE: la plaquita del duende tallado de la plaza.
//   · CUENTOS_DOMINGO: el recuerdo que queda en el cuaderno después de escuchar a la abuela.
// Cada libro leído por primera vez, la plaquita y los cuentos son una entrada del cuaderno en la
// sección «De la aldea» (ver cuaderno.js).

export const LIBROS_ALDEA = [
  // ---------------------------------------------------------------- leyendas
  {
    id: 'libro-calafate', titulo: 'La leyenda del calafate', tema: 'leyenda', de: 'Leyendas de la Patagonia',
    partes: [
      'Cuentan los tehuelches que Koonek era una mujer muy vieja que ya no podía seguir a su gente cuando, al llegar el otoño, levantaba los toldos y marchaba al norte.',
      'Se quedó sola en la meseta, con el viento. Los pájaros, que también se iban, la vieron temblar de frío. Al volver en primavera la encontraron convertida en una mata espinosa, con flores amarillas.',
      'Para que no la dejaran nunca más, la mata les dio frutos azules y dulces. Por eso se dice que quien come calafate vuelve siempre a la Patagonia.',
    ],
  },
  {
    id: 'libro-amancay', titulo: 'La flor del amancay', tema: 'leyenda', de: 'Leyendas de la Patagonia',
    partes: [
      'Dicen que Amancay era una muchacha de la cordillera que quería a Quintral, el hijo del lonko. Una fiebre lo tumbó, y los viejos dijeron que sólo lo iba a levantar el té de una flor amarilla que crecía en lo más alto.',
      'Amancay subió por las piedras hasta donde vive el cóndor. El dueño de las alturas le dio la flor, pero le pidió algo a cambio: su corazón. Ella dijo que sí.',
      'Las gotas que cayeron por la ladera se volvieron flores. Por eso el amancay es amarillo, como la flor que bajó, y tiene en los pétalos unas pintitas rojas.',
    ],
  },
  {
    id: 'libro-puertitas', titulo: 'Las puertitas de los coihues', tema: 'leyenda', de: 'Cosas de la aldea, juntadas por la abuela Herminia',
    partes: [
      'Cuando la cuadrilla abría el monte para tender la vía, un peón encontró en la raíz de un coihue una puertita de madera, del tamaño de una mano, con su picaporte y todo.',
      'Después aparecieron otras, siempre en raíces viejas y siempre cerradas. Nadie supo nunca quién las tallaba. Los peones les dejaban una galleta al costado, por las dudas.',
      'Cuando se levantó la parada, alguien escribió en la tabla «Aldea de los Duendes», y el nombre quedó. Hasta hoy, en la aldea se golpea antes de abrir cualquier puerta chica.',
    ],
  },
  {
    id: 'libro-nahuelito', titulo: 'El bicho del lago', tema: 'leyenda', de: 'Cosas que se cuentan en el sur',
    partes: [
      'Desde hace más de cien años, en los lagos del sur hay quien jura haber visto un lomo oscuro y largo que asoma un momento y se hunde sin hacer ruido. En el Nahuel Huapi le dicen el Nahuelito.',
      'En 1922 salió desde Buenos Aires una expedición a buscar un animal antiguo en una laguna de Chubut. Volvieron sin nada, pero con la historia en todos los diarios.',
      'Los que saben de lagos hablan de troncos que suben del fondo, de olas cruzadas y de cardúmenes. Los que lo vieron no discuten: miran el agua y se quedan callados.',
    ],
  },
  // ---------------------------------------------------------------- historia del valle
  {
    id: 'libro-trochita', titulo: 'La trochita', tema: 'historia', de: 'Historia del ferrocarril patagónico',
    partes: [
      'La trochita es un tren de trocha angosta: setenta y cinco centímetros entre riel y riel. Por eso puede doblar donde el terreno no da para más y subir cuestas que un tren grande no subiría.',
      'Sus locomotoras a vapor llegaron en 1922: unas de Baldwin, de Estados Unidos, y otras de Henschel, de Alemania. El ramal de Ingeniero Jacobacci a Esquel se terminó en 1945.',
      'Llevaba lana, leña, correo y pasajeros. En invierno, cada coche tiene su salamandra, y el guarda le echa leña mientras el tren cruza la meseta nevada.',
    ],
  },
  {
    id: 'libro-cuadrilla', titulo: 'Los que tendieron la vía', tema: 'historia', de: 'Historia del ferrocarril patagónico',
    partes: [
      'La vía no la tendió una máquina: la tendieron cuadrillas de hombres con pico, pala y barreta. Criollos, chilenos, gente que había llegado en barco: cada uno con su idioma y el mate de todos.',
      'Vivían en carpas y vagones que avanzaban con la obra. Cada tanto quedaba atrás un galpón, un tanque de agua o un andén de dos tablas, y alrededor, a veces, un pueblo.',
      'Muchas paradas de la línea nacieron así: primero el andén, después el almacén de ramos generales, la escuela y las casas. Esta aldea es una de ellas.',
    ],
  },
  {
    id: 'libro-galeses', titulo: 'Los galeses del Mimosa', tema: 'historia', de: 'La gente que llegó al sur',
    partes: [
      'En 1865 llegó a la costa de Chubut el Mimosa, un velero con unos ciento cincuenta galeses que buscaban un lugar donde vivir con su lengua y sus costumbres.',
      'El comienzo fue duro: el valle era seco y la cosecha no salía. Aprendieron de los tehuelches a moverse por la meseta y cavaron canales para regar con el agua del río.',
      'En 1885 una expedición llegó a la cordillera y bautizó el valle 16 de Octubre. De ellos quedaron las chacras, los molinos y la costumbre del té con torta negra.',
    ],
  },
  {
    id: 'libro-bibliotecas', titulo: 'Las bibliotecas populares', tema: 'historia', de: 'Folleto de la Biblioteca Popular',
    partes: [
      'En 1870, una ley impulsada por Sarmiento creó la comisión que ayuda a las bibliotecas populares. Desde entonces, en todo el país, los vecinos las fundan y las sostienen ellos mismos.',
      'Una biblioteca popular no es del gobierno ni de nadie en particular: es de la asociación de vecinos que la arma, consigue los libros y abre la puerta.',
      'Esta empezó con una caja de libros que llegó en el tren y una estufa a leña. El libro de socios todavía tiene la primera página firmada por el jefe de estación.',
    ],
  },
  {
    id: 'libro-parque', titulo: 'El primer parque nacional', tema: 'historia', de: 'Cuadernillo de la seccional',
    partes: [
      'En 1903 el perito Francisco Moreno donó tres leguas de tierra junto al lago Nahuel Huapi con un pedido: que quedaran para siempre como lugar público, para que todos pudieran disfrutarlas.',
      'De esa donación nació el Parque Nacional del Sud, y en 1934 la ley que creó el Parque Nacional Nahuel Huapi, el primero del país.',
      'Desde entonces los guardaparques cuidan el bosque, cuentan los animales y apagan los fuegos mal apagados. Su trabajo es que el valle siga siendo valle.',
    ],
  },
  {
    id: 'libro-telegrafo', titulo: 'Rayas y puntos', tema: 'historia', de: 'Manual del telegrafista',
    partes: [
      'Antes del teléfono, las noticias viajaban por un alambre colgado de postes: el telégrafo. El telegrafista apretaba una llave y del otro lado se oían rayas y puntos.',
      'Cada letra tiene su código. La S son tres puntos, la O tres rayas. Un telegrafista bueno escribía de oído, sin mirar la cinta, más rápido de lo que uno habla.',
      'En los pueblos del sur, la estafeta era también telégrafo: ahí llegaban el pronóstico, el precio de la lana y la carta que todos esperaban.',
    ],
  },
  // ---------------------------------------------------------------- flora y fauna
  {
    id: 'libro-huemul', titulo: 'El huemul', tema: 'naturaleza', de: 'Animales de la cordillera',
    partes: [
      'El huemul es un ciervo petiso y robusto, hecho para las laderas empinadas. El macho lleva astas cortas que se le caen y le vuelven a salir cada año.',
      'Antes había huemules en toda la cordillera. Hoy quedan pocos, en lugares altos y apartados, y en Argentina fue declarado monumento natural.',
      'Es tranquilo y confiado: muchas veces se queda mirando al que lo mira. Por eso hay que verlo de lejos, en silencio, y dejarlo seguir su camino.',
    ],
  },
  {
    id: 'libro-monito', titulo: 'El monito del monte', tema: 'naturaleza', de: 'Animales de la cordillera',
    partes: [
      'El monito del monte no es un mono: es un marsupial chiquito, de ojos enormes y cola peluda, pariente lejano de los de Australia. Vive en los bosques húmedos y sale de noche.',
      'En otoño junta grasa en la base de la cola y en invierno duerme semanas enteras, enroscado en un nido de musgo y hojas de caña.',
      'Come frutos e insectos, y al comer reparte las semillas del quintral por todo el bosque. Hay árboles que, sin él, no tendrían quién los plante.',
    ],
  },
  {
    id: 'libro-chucao', titulo: 'El chucao', tema: 'naturaleza', de: 'Pájaros del bosque',
    partes: [
      'El chucao es un pájaro chico, pardo, con el pecho colorado y la cola parada. Casi no vuela: anda a saltitos entre las cañas y los troncos caídos.',
      'Lo que tiene es voz. Su grito, fuerte y de golpe, se oye lejos y asusta al que no lo conoce. Muchas veces está a dos metros y no se lo ve.',
      'Los paisanos dicen que si canta a tu derecha el viaje va a salir bien, y si canta a la izquierda conviene ir con cuidado. Él, mientras tanto, sigue buscando bichitos.',
    ],
  },
  {
    id: 'libro-condor', titulo: 'El cóndor andino', tema: 'naturaleza', de: 'Pájaros de la cordillera',
    partes: [
      'El cóndor es una de las aves voladoras más grandes del mundo: con las alas abiertas pasa los tres metros. Casi no aletea: sube en las corrientes de aire caliente y planea horas.',
      'Se alimenta de animales muertos, y así limpia el campo. Busca desde lo alto y baja cuando ve a otros juntarse.',
      'Puede vivir más de cincuenta años y cría un solo pichón cada dos años. Por eso, cuando se lo ve pasar sobre el valle, vale la pena parar y mirarlo.',
    ],
  },
];
export const LIBRO_ALDEA = Object.fromEntries(LIBROS_ALDEA.map((l) => [l.id, l]));

// La plaquita del duende tallado de la plaza.
export const PLACA_DUENDE = {
  id: 'duende-plaza', titulo: 'El duende de la plaza',
  partes: [
    'En una plaquita de bronce, al pie del tronco: «Duende del Valle. Tallado por los vecinos de la aldea en un coihue que tumbó el viento».',
    'Y más abajo, en letra chica: «Cuando tendieron la vía, los peones encontraron puertitas talladas en las raíces de los coihues. Nunca se supo quién las hizo. Golpeá antes de abrir».',
  ],
};

// Lo que queda en el cuaderno después de escuchar entero un cuento de la abuela, sentado.
export const CUENTOS_DOMINGO = {
  id: 'cuentos-domingo', titulo: 'Los cuentos del domingo',
  texto: 'Los domingos a la mañana, en la biblioteca, la abuela Herminia lee y cuenta junto a la estufa a leña. Los chicos se sientan en la alfombra y los grandes en las sillas de lectura. Esa mañana te sentaste a escucharla con los vecinos, y el cuento se te quedó.',
};
