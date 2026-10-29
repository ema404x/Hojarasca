// 4.16.0 (B): los textos del ACTO II de la Historia («El trato del molino», capítulos 5 a 8) como DATOS: tarjetas de entrada (con la puerta de
// estación y variantes) y de cierre (con variantes según las decisiones D1 a D4), objetivos, premios, notas y objetos que se leen, el cuaderno
// de lo raro (con el mismo id que los efectos `raro:<id>` de las escenas) y las líneas de charla «tema de historia» de los vecinos.
// Módulo puro. Lo escribe el agente B; lo enchufa el agente A. Sin inglés: se traduce todo al final. Misma forma que historia-texto-acto1.js:
//   capitulos[n] = { n, id, titulo, acto, estacion, dia, minutos, entrada: [párrafos], puerta?, entradaSegun?, objetivos, optativas, premio, cierre }
//   notas[id] = { titulo, texto: [párrafos] }      objetos[id] = { nombre, texto }      raro[id] = { titulo, texto, cap, donde }
//   charla[quien] = [{ id, cap, texto, cuando? }]  (`cuando`: { decision, es } | { optativa } | { escena })
// Las decisiones: D1 `bolsa` (acto I), D2 `coihue`, D3 `molienda`, D4 `cuaderno`; todas con valor 'a' | 'b' | 'c'.

export const TEXTO_ACTO2 = {
  capitulos: {
    5: {
      n: 5, id: 'rueda', titulo: 'La rueda', acto: 2, estacion: 'otoño', dia: 5, minutos: '35 / 45',
      entrada: [
        'Una mañana las lengas amanecieron coloradas. Josefina golpeó tu puerta temprano, sin el sombrero y con la tablilla abajo del brazo.',
        '«Vení», dijo. «Te quiero mostrar algo. Traé el hacha, pero no la uses.»',
      ],
      // la puerta de estación: si todavía es verano, o si el otoño ya pasó
      puerta: {
        temprano: ['Las lengas todavía están verdes. Ramón dice que el molino se arma con el agua del deshielo de otoño: esperá a que se pongan coloradas.'],
        tarde: ['El otoño se te pasó volando y el arroyo vino crecido, con ganas. Josefina te espera igual junto a la puerta, con la tablilla abajo del brazo.'],
      },
      objetivos: [
        { id: 'piedras', texto: 'Andá con Josefina a las piedras del molino viejo, arroyo arriba', tecla: 'E' },
        { id: 'zaino', texto: 'Pedile el zaino a Ramón y acarreá tres troncos y seis piedras al molino', tecla: 'E' },
        { id: 'molino', texto: 'Construí un molino de agua sobre el arroyo (O → Trabajo)', tecla: 'O' },
        { id: 'coihue', texto: 'Decidí qué hacer con el coihue grande y cumplilo', tecla: 'E' },
        { id: 'habas', texto: 'Sembrá habas en un cantero', tecla: 'E' },
        { id: 'puente', texto: 'La crecida aflojó el puente del arroyo: decidí qué hacer', tecla: '·' },
      ],
      optativas: [
        { id: 'trigo-abuelo', texto: 'El trigo del abuelo: Josefina te muestra una foto en la seccional' },
        { id: 'tablas-tito', texto: 'Las tablas de Tito: vendele seis tablas de coihue en la carpintería' },
        { id: 'truchas', texto: 'Primeras truchas del otoño, con Nicanor' },
      ],
      premio: { texto: 'Cuatro medidas de harina y semillas de habas', cuenta: { harina: 4 }, desbloqueo: 'molino-de-la-historia' },
      cierre: {
        base: ['La rueda agarró el ritmo del arroyo. Adentro, la muela hace un ruido hondo que se siente en los pies.'],
        segun: {
          d: 'coihue',
          a: 'El coihue quedó en pie, mirando el molino como si lo hubiera estado esperando.',
          b: 'Donde estaba el coihue quedó un tocón ancho como una mesa. Esa noche no se oyeron risas. Se oyó otra cosa.',
          c: 'La pirca de Tobías abraza la raíz del coihue. Josefina pasó la mano por las piedras y no dijo nada, que en ella es mucho.',
        },
      },
    },
    6: {
      n: 6, id: 'perdidas', titulo: 'Lo que se pierde, aparece', acto: 2, estacion: 'otoño', dia: 6, minutos: '30 / 40',
      entrada: [
        'Desde que el molino muele, en el valle se pierden cosas. No muchas: un dedal de Ercilia, la pipa de Belisario, la cuchara de palo de Rosa. Y aparecen, días después, en lugares imposibles: arriba de un poste, adentro de una bota, en el medio de la vía.',
        'Nicanor dice que de noche hay luces sobre el lago. Nadie le cree. Vos sí.',
      ],
      entradaSegun: {
        d: 'bolsa',
        a: 'Esta mañana, en tu umbral, había un puñado de piñones bien juntitos. No los dejó el viento.',
        b: 'En la panadería, Rosa encontró una huella de dedo en la masa. Una huella de dedo muy chico.',
        c: 'Josefina anda mirando el piso en todos lados, como buscando algo que no se anima a nombrar.',
      },
      objetivos: [
        { id: 'preguntar', texto: 'Preguntá en la aldea por las cosas perdidas: hablá con Ercilia y con Rosa', tecla: 'E' },
        { id: 'perdidas', texto: 'Encontrá las tres cosas perdidas (el dedal, la pipa, la cuchara) y devolvelas', tecla: 'E' },
        { id: 'lago', texto: 'Salí al lago de noche, en kayak o velero, y acercate al faro', tecla: 'E' },
        { id: 'guardia', texto: 'Hacé guardia de noche en el banco del molino', tecla: 'E' },
        { id: 'huellas', texto: 'Seguí las huellas de la mañana hasta la ladera', tecla: '·' },
      ],
      optativas: [
        { id: 'masa-crece', texto: 'La masa que crece sola: Rosa quiere compañía una noche en la panadería' },
        { id: 'foto-sofia', texto: 'Foto para Sofía: llevale la foto movida al estudio' },
        { id: 'tres-de-tres', texto: 'Tres de tres: el encargo de pesca de Nicanor' },
      ],
      premio: { texto: 'Una lámpara de aceite de Eusebio, que se cuelga en el molino, y yerba', cuenta: { yerba: 4 }, objetos: ['lampara-eusebio'], desbloqueo: 'farol-y-lugares-raros' },
      cierre: {
        base: [
          'Ramón no te dijo nada y vos no le preguntaste. Hay cosas que en el valle se saben de costado.',
          'Las cosas perdidas volvieron a sus dueños. Ercilia guardó el dedal en el bolsillo del delantal y dijo «gracias» mirando para el lado del bosque. No a vos: para el bosque.',
        ],
        segun: {
          d: 'coihue',
          a: 'Lo que viste anoche entre las raíces no se lo contaste a nadie. Ellos tampoco.',
          b: 'En la chapa del molino quedó un montoncito de bellotas, como una cuenta que alguien dejó hecha.',
          c: 'La pirca de Tobías silbó toda la noche, bajito, como si tarareara.',
        },
      },
    },
    7: {
      n: 7, id: 'cosecha', titulo: 'La cosecha', acto: 2, estacion: 'otoño', dia: 7, minutos: '30 / 40',
      entrada: [
        'Las habas están gordas, la muela está caliente y en la aldea se habla de la Fiesta de la Cosecha y de la minga.',
        'Graciela volvió en el tren de la mañana, con el portafolios y botas nuevas: alguien le avisó del barro. «Vengo a contar», dijo. Elsa le contestó: «Cuente, cuente. Hoy hay mucho».',
      ],
      entradaSegun: {
        d: 'coihue',
        a: 'El coihue sigue en pie, mirando el molino. Josefina pasa seguido, como quien visita a un viejo.',
        b: 'Del tocón ya no se oyen bellotas. Se oye un silencio de tocón, que es peor.',
        c: 'La pirca de Tobías silba un poquito con el viento, y cada vez que pasa alguien, baja la voz.',
      },
      objetivos: [
        { id: 'cosecha', texto: 'Cosechá seis veces de la huerta', tecla: 'E' },
        { id: 'molido', texto: 'Molé diez medidas de harina en tu molino', tecla: 'E' },
        { id: 'galponcito', texto: 'Construí un galpón para guardar las bolsas (O → Trabajo)', tecla: 'O' },
        { id: 'molienda', texto: 'Decidí qué hacer con la primera molienda y cumplilo', tecla: 'E' },
        { id: 'minga', texto: 'Llevá algo cocinado a la minga: pan casero, tortas fritas o empanadas', tecla: 'E' },
        { id: 'galpon', texto: 'Entrá al galpón a la mañana siguiente a la minga', tecla: 'E' },
      ],
      optativas: [
        { id: 'concurso', texto: 'Concurso del dulce de otoño, con dulce de calafate' },
        { id: 'fermin-habla', texto: 'Fermín quiere hablar: buscalo en el galpón de esquila después de la minga' },
      ],
      premio: { texto: 'Ninguno material: el cuaderno de Eusebio, que se lee en el diario, página por página', objetos: ['cuaderno-eusebio'], desbloqueo: 'pagina-de-tratos' },
      cierre: {
        base: [
          'No faltaba nada. Ni una medida. Estaba todo en el piso, en ronda, como si alguien hubiera querido mostrarte cuánto era.',
          'Y abajo, enterrado, el cuaderno del molinero. Alguien sabía que estaba ahí. Alguien quiso que lo tuvieras.',
          'Cerraste el galpón. Después lo volviste a abrir y dejaste la puerta entornada. No sabés bien por qué.',
        ],
        segun: {
          d: 'molienda',
          a: 'En la estación, Elsa clavó con una chinche el recibo del tercer flete. Cuando lo mira, el rodete se le ilumina.',
          b: 'En el almacén, la libreta del fiado largo ya tiene tantos nombres que Nélida pidió un renglón más.',
          c: 'En el hueco de la raíz, la bolsa de harina ya no estaba cuando volviste. Nadie preguntó nada.',
        },
      },
    },
    8: {
      n: 8, id: 'cuaderno', titulo: 'El cuaderno de Eusebio', acto: 2, estacion: 'otoño', dia: 8, minutos: '30 / 40',
      entrada: [
        'El cuaderno tiene cuarenta años de cuentas: bolsas, maquilas, nombres de vecinos que ya no están. Y entre las cuentas, otras cosas. Dibujos de puertitas. Una lista que dice «lo que dejaron»: un canto blanco, piñones, una pluma de cóndor, «la llave que perdí en el 79».',
        'Y una frase subrayada dos veces: «Cuando la nieve tapa el paso, los del cerro bajan. Los de abajo les tienen más miedo que nosotros.»',
      ],
      entradaSegun: {
        d: 'molienda',
        a: 'Graciela pasó por la estación con la planilla y una sonrisa chica: el ramal respira un poco más hondo.',
        b: 'Hay más vecinos que de costumbre en el almacén: el fiado largo les cambió las cuentas del invierno.',
        c: 'Una bolsa de harina menos, una bolsa de harina más lejos. Con tantas partes repartidas, el valle te mira con otra confianza.',
      },
      objetivos: [
        { id: 'leer', texto: 'Leé el cuaderno de Eusebio: son tres partes, en el diario', tecla: '·' },
        { id: 'ercilia', texto: 'Mostrale el cuaderno a Ercilia, en el almacén', tecla: 'E' },
        { id: 'josefina', texto: 'Mostrale el cuaderno a Josefina, en la seccional', tecla: 'E' },
        { id: 'belisario', texto: 'Andá al Puesto del Paso y preguntale a Belisario por «los del cerro»', tecla: 'E' },
        { id: 'ramon', texto: 'Subí al Puesto Alto a ver a Ramón al atardecer', tecla: 'E' },
        { id: 'fogon', texto: 'En el fogón: contar o callar', tecla: 'E' },
      ],
      optativas: [
        { id: 'veta-vuelve', texto: 'La veta que vuelve: Tobías te espera de noche en la cantera' },
        { id: 'mulas', texto: 'Las mulas de Belisario: acompañá la tropa a caballo hasta el mallín' },
        { id: 'noventa', texto: 'Herminia y los noventa: llevale una torta' },
      ],
      premio: {
        texto: 'Yerba y una pluma de cóndor, que aparece en tu umbral esa noche', cuenta: { yerba: 4 }, objetos: ['pluma-condor'], desbloqueo: 'horario-de-invierno',
        segun: {
          d: 'cuaderno',
          a: 'La aldea te trae leña para el invierno: seis troncos secos.',
          b: 'Ramón te regala su poncho viejo.',
          c: 'Graciela te consigue un flete de «material de estudio» (suma al ramal).',
        },
      },
      cierre: {
        base: [
          'Esa noche, de vuelta del fogón, el valle estaba lleno de ruidos chiquitos: hojas, agua, algo que corría.',
          'Ya no te dieron miedo. Te dieron otra cosa, más difícil de nombrar: la sensación de que el valle te estaba mirando para ver qué hacías.',
          'En la cordillera, arriba de todo, cayó la primera nieve.',
        ],
        segun: {
          d: 'cuaderno',
          a: 'Por el camino, tres vecinos te saludaron con un gesto nuevo: no el de siempre, sino el de quien comparte un secreto abierto.',
          b: 'Por el camino, Ramón y Josefina caminaron un tramo a tu lado sin decir nada. No hizo falta.',
          c: 'Por el camino, Josefina te dijo que mañana escribe la carta. Y que le tiembla el pulso, y que la escribe igual.',
        },
      },
    },
  },

  // lo que se lee: las páginas del cuaderno, la libreta, el cuaderno del abuelo, carteles y recados
  notas: {
    'cuaderno-0': { titulo: 'El cuaderno de Eusebio: la tapa', texto: ['Molino del Arroyo. E. Millán. Cuentas y tratos.', 'Al que tenga la llave. Si estás leyendo esto, ellos te lo dieron, y yo no estoy.', 'No les tengas miedo, pero tampoco les tengas confianza: tené trato. El trato es así: el molino muele para todos los del valle. Para todos. Y gracias.'] },
    'cuaderno-1': { titulo: 'El cuaderno de Eusebio: cuentas y tratos', texto: ['Año de la nevada grande. Maquila de don Aníbal Salazar: tres bolsas. Pagó con un gallo, que me cantó todo el invierno. Y gracias.', 'Maquila de la viuda de Prieto: ninguna, que la viuda no paga. La viuda es la que más me trae. Y gracias.', 'Anoto lo que se debe y lo que se deja. Lo que se deja casi siempre vuelve. Lo que se debe casi nunca se cobra.', 'Ese invierno faltaron tres bolsas de la ronda. Aparecieron en el techo del galpón, atadas con una cinta colorada. No las bajé hasta que me hicieron señas de que se podía.'] },
    'cuaderno-2': { titulo: 'El cuaderno de Eusebio: puertitas y una lista', texto: ['Raíz de coihue, ancho de una mano. Raíz de pehuén, ancho de una palma. Con bisagra de cuero. Todas cierran para adentro, ninguna para afuera.', 'LO QUE DEJARON: un canto blanco, liso. Piñones, una mano llena. Una pluma de cóndor, larga como el antebrazo. La llave que perdí en el 79.', 'La había perdido en el arroyo; me la devolvieron seca, con aceite. Y gracias.'] },
    'cuaderno-3': { titulo: 'El cuaderno de Eusebio: la frase subrayada', texto: ['Cuando la nieve tapa el paso, los del cerro bajan. Los de abajo les tienen más miedo que nosotros.', 'Los del cerro no son malos. Tienen hambre y están lejos de casa, que en cualquiera es una mala combinación.', 'Si alguna vez el trato se rompe, no culpes a los de abajo. Fijate quién cerró primero la puerta.'] },
    'libreta-raiz': { titulo: 'La libreta de fiado de la abuela de Ercilia', texto: ['LOS DE LA RAÍZ. Debe: nada. Se les debe: una.', 'La letra es de Eusebio. La tinta es más nueva que el papel.'] },
    'cuaderno-abuelo': { titulo: 'El cuaderno del abuelo de Josefina', texto: ['Puertitas en raíces, a lápiz, con medidas: ancho, alto, madera, fecha.', 'Al pie de la última hoja, con letra firme: «El molino muele para todos los del valle. Para todos.»'] },
    'aviso-minga': { titulo: 'Cartel de la minga', texto: ['MINGA DEL VALLE. Sábado, en el camino del refugio a la aldea. Se trae pala, carretilla o ganas. Se come en el lugar. El que no pueda venir, que mande mate.'] },
    'recado-belisario': { titulo: 'Recado de Belisario', texto: ['Para Fermín: mi oferta sigue. Las mulas no esperan, pero yo sí, un poquito.'] },
    // la página de tratos: una frase por lo que convidaste (la arma el aplicador con las decisiones y los indicios que ya viste)
    'pagina-tratos': {
      titulo: 'Página de tratos',
      texto: ['Lo que dejaste y lo que te dejaron, con la letra de Eusebio.'],
      segun: {
        bolsa: {
          a: 'Una bolsa de harina, en la raíz del coihue grande, antes del primer frío. Y gracias.',
          b: 'Una bolsa de harina, convertida en pan para la aldea. Ellos todavía no opinaron. Y gracias.',
          c: 'Una bolsa de harina, en manos de Josefina. A veces el trato pasa por muchas manos. Y gracias.',
        },
        coihue: {
          a: 'El coihue quedó en pie. Anotado.',
          b: 'El coihue cayó. Anotado también.',
          c: 'Una pirca de piedras redondas abraza la raíz. Anotado con letra grande.',
        },
      },
    },
  },

  // la descripción de los objetos de historia (cuando los mirás en la mochila o en la repisa)
  objetos: {
    'foto-movida': { nombre: 'La foto movida', texto: 'Tres manchas doradas sobre un fondo negro, y algo que parece, si uno quiere, la punta de un ala. Salió como sale todo lo que importa: movida.' },
    'lampara-eusebio': { nombre: 'La lámpara de Eusebio', texto: 'Una lámpara de aceite de bronce, con el vidrio ahumado de tanta noche. Se cuelga en el molino. Todavía huele a harina.' },
    'cuaderno-eusebio': { nombre: 'El cuaderno de Eusebio', texto: 'Tapas oscuras, tinta corrida de tanto guardarse. «Molino del Arroyo. E. Millán. Cuentas y tratos.» Se lee en el diario, página por página.' },
    'pluma-condor': { nombre: 'La pluma de cóndor', texto: 'Larga como un antebrazo, negra, con la punta blanca. Figura en la lista de Eusebio. Está tibia.' },
    'llavecita': { nombre: 'La llavecita', texto: 'Una llave de bronce chiquita, con el ojo en forma de hoja. Herminia la encontró de nena en una raíz. No se sabe a qué puerta abre.' },
    'cantos-blancos': { nombre: 'Diez cantos blancos', texto: 'Cantos rodados, blancos, lisos como huevos. Los de la veta de la cantera. Sirven para la honda.' },
    'dedal-ercilia': { nombre: 'El dedal de Ercilia', texto: 'Un dedal de plata gastado. Estaba arriba de un poste del andén.' },
    'pipa-belisario': { nombre: 'La pipa de Belisario', texto: 'Una pipa de madera oscura, con la boquilla mordida. Apareció en la vía, cerca del faro.' },
    'cuchara-rosa': { nombre: 'La cuchara de Rosa', texto: 'Una cuchara de palo larga, con el mango chupado de tantos panes. Estaba adentro de una bota, en un tendal.' },
    'poncho-ramon': { nombre: 'El poncho viejo de Ramón', texto: 'Un poncho grueso de lana cruda, con olor a humo y a oveja. Tiene un remiendo en el hombro que Ramón dice que es de nacimiento.' },
  },

  // el cuaderno de lo raro: indicios con fecha y lugar. Los ids son los de los efectos `raro:<id>` de las escenas.
  raro: {
    'muelas-molino-viejo': { titulo: 'Las muelas del molino viejo', texto: 'Dos muelas rotas, grandes como mesas, junto al arroyo. Detrás, el coihue más grande que vi. Josefina dice que ese no se toca.', cap: 5, donde: 'molino viejo' },
    'coihue-en-pie': { titulo: 'El coihue quedó en pie', texto: 'Dejé el coihue en su lugar y armé el aserradero lejos. Josefina cuenta los pasos. Tito camina más.', cap: 5, donde: 'aserradero' },
    'coihue-talado': { titulo: 'El tocón', texto: 'Taló el coihue. Un tocón ancho como una mesa y doce tablas derechas. El aire cambió: no sé decir cómo.', cap: 5, donde: 'molino viejo' },
    'pirca-coihue': { titulo: 'La pirca de la raíz', texto: 'Piedras redondas puestas en rueda alrededor de la raíz, sin cemento. Cuando sopla el viento silban un poquito.', cap: 5, donde: 'coihue grande' },
    'rueda-primera-vuelta': { titulo: 'La rueda giró', texto: 'La rueda se quejó, agarró ritmo y la muela empezó a hablar. Josefina se quedó mirando un rato largo.', cap: 5, donde: 'molino' },
    'puntos-verdes': { titulo: 'Dos puntitos verdes', texto: 'Entre las raíces del coihue, dos puntitos verdes que se encendieron un segundo y se apagaron.', cap: 5, donde: 'coihue grande' },
    'foto-carro-abuelo': { titulo: 'El carro del abuelo', texto: 'Una foto del abuelo de Josefina con el carro de trigo. Atrás, en la esquina, se ve la rueda de Eusebio.', cap: 5, donde: 'seccional' },
    'luces-faro-medianoche': { titulo: 'Las luces del faro', texto: 'Nicanor dice que salen cerca del faro a medianoche, que hay que ir despacio y que si se rema fuerte, se apagan.', cap: 6, donde: 'muelle' },
    'lechucero-faro': { titulo: 'El que vuela', texto: 'Contra la luna cruzó una lechuza con algo chiquito montado, y tres lucecitas ámbar la siguieron sobre el agua.', cap: 6, donde: 'lago, cerca del faro' },
    'foto-movida': { titulo: 'La foto movida', texto: 'Saqué la foto. Salió como sale todo lo que importa: movida. Tres manchas doradas y algo que parece un ala.', cap: 6, donde: 'lago' },
    'guardia-saludo': { titulo: 'Los que saludan', texto: 'Una silueta, después dos, después cinco, entre las raíces del coihue. Una levantó la mano. Se saluda a quien todavía no se conoce.', cap: 6, donde: 'molino' },
    'noche-piedritas': { titulo: 'La noche de las piedritas', texto: 'No saludaron. Tiraron bellotas al techo toda la noche. Hay vecinos así también.', cap: 6, donde: 'molino' },
    'huellas-escarcha': { titulo: 'Huellas en la escarcha', texto: 'Huellas de pie chiquito y descalzo, que brillan un poco más que la escarcha, suben por la ladera hacia el Puesto Alto.', cap: 6, donde: 'ladera del molino' },
    'yerba-en-raiz': { titulo: 'Yerba en una raíz', texto: 'En una raíz de pehuén, sobre una hoja de nalca, un puñado de yerba puesto con prolijidad de almacenero.', cap: 6, donde: 'ladera del Puesto Alto' },
    'ramon-yerba': { titulo: 'Ramón y la yerba', texto: 'Vi a Don Ramón dejar la yerba en la raíz y sacarse la boina un segundo. No me vio. No pregunto nada.', cap: 6, donde: 'ladera del Puesto Alto' },
    'cosas-perdidas': { titulo: 'Las cosas perdidas', texto: 'El dedal, la pipa y la cuchara aparecieron en lugares imposibles. Ercilia dio las gracias mirando para el bosque.', cap: 6, donde: 'almacén' },
    'masa-crece': { titulo: 'La masa que crece', texto: 'La masa madre de Rosa creció hasta el techo con marcas de deditos. A las tres menos veinte la puerta del horno se cerró sola.', cap: 6, donde: 'panadería' },
    'foto-ojo': { titulo: 'Un ojo', texto: 'Sofía dice que la mancha dorada de la foto no es una mancha: es un ojo, con pupila vertical y reflejos de la luna.', cap: 6, donde: 'estudio de fotos' },
    'diez-bolsas': { titulo: 'Diez bolsas', texto: 'La primera molienda: diez bolsas tibias junto a la puerta del molino. Josefina dice que su abuelo dejaba una aparte.', cap: 7, donde: 'molino' },
    'fletes-harina': { titulo: 'Harina por la trochita', texto: 'Seis bolsas a Esquel en tres fletes. Graciela anotó «con constancia».', cap: 7, donde: 'Estación del Valle' },
    'fiado-invierno': { titulo: 'El fiado largo', texto: 'La harina de Eusebio quedó anotada en la libreta del almacén. Debajo, una línea de otra mano: «Se les debe: una».', cap: 7, donde: 'almacén' },
    'bolsa-raiz-segunda': { titulo: 'Otra bolsa a la raíz', texto: 'Dejé una bolsa de mi harina en la raíz del coihue. Esta vez fue mía.', cap: 7, donde: 'coihue grande' },
    'minga-aldea': { titulo: 'La minga', texto: 'Veinte personas con palas y mates. Fermín quiso decirle algo a Ramón y Ramón le pidió la pala.', cap: 7, donde: 'camino a la aldea' },
    'galpon-ronda': { titulo: 'La harina en ronda', texto: 'Doce montoncitos de harina en ronda como las horas de un reloj, con huellas chiquitas alrededor. No faltaba ni una medida.', cap: 7, donde: 'mi galpón' },
    'pozo-topo': { titulo: 'El pozo del medio', texto: 'En el centro de la ronda, un pozo recién hecho en la tierra del piso. Un topo, creo. Un topo con método.', cap: 7, donde: 'mi galpón' },
    'cuaderno-hallado': { titulo: 'El cuaderno de Eusebio', texto: 'Envuelto en hule, adentro del pozo: «Molino del Arroyo. E. Millán. Cuentas y tratos.» Alguien quiso que lo tuviera.', cap: 7, donde: 'mi galpón' },
    'cuaderno-cuentas': { titulo: 'Las cuentas del cuaderno', texto: 'Cuarenta años de maquilas. Una viuda que no paga y es la que más trae. Tres bolsas en el techo atadas con una cinta colorada.', cap: 8, donde: 'refugio' },
    'lista-dejaron': { titulo: 'Lo que dejaron', texto: 'Un canto blanco, piñones, una pluma de cóndor y la llave que Eusebio perdió en el 79. Me la devolvieron seca, con aceite.', cap: 8, donde: 'refugio' },
    'frase-del-cerro': { titulo: 'La frase subrayada', texto: 'Cuando la nieve tapa el paso, los del cerro bajan. Los de abajo les tienen más miedo que nosotros.', cap: 8, donde: 'refugio' },
    'libreta-raiz': { titulo: 'Los de la raíz', texto: 'En la libreta de fiado de la abuela de Ercilia: «Los de la raíz. Debe: nada. Se les debe: una.» Con la letra de Eusebio.', cap: 8, donde: 'almacén' },
    'cuaderno-abuelo': { titulo: 'El cuaderno del abuelo', texto: 'Dibujos de puertitas con medidas, a lápiz. «El molino muele para todos los del valle. Para todos.»', cap: 8, donde: 'seccional' },
    'los-del-cerro': { titulo: 'Los del cerro', texto: 'Más viejos, más grandes, con barba de liquen. Bajan cuando la nieve tapa el paso. Los chiquitos de las raíces les disparan.', cap: 8, donde: 'Puesto del Paso' },
    'secreto-ceniza': { titulo: 'El invierno de la ceniza', texto: 'Ramón me contó los piñones en la puerta, un mes entero. Nunca supo quién. Por eso deja la yerba. No le cuento a nadie.', cap: 8, donde: 'Puesto Alto' },
    'ramon-de-lejos': { titulo: 'Ramón, de lejos', texto: 'Lo vi de lejos junto a una raíz de pehuén. Se agachó, dejó algo, se quedó un rato con la boina en la mano.', cap: 8, donde: 'ladera del Puesto Alto' },
    'fogon-leyenda': { titulo: 'El fogón', texto: 'Media aldea alrededor del fuego y tres cuadernos en mis manos. Lo que se dijo esa noche ya no se desdice.', cap: 8, donde: 'predio de la aldea' },
    'pluma-condor': { titulo: 'Una pluma de cóndor', texto: 'Apoyada en mi puerta, larga como un antebrazo, con la punta blanca. Está en la lista de Eusebio.', cap: 8, donde: 'refugio' },
    'veta-vuelve': { titulo: 'La veta que vuelve', texto: 'En la cantera, alguien rellenó la veta con cantos rodados blancos, los mismos que el de mi umbral.', cap: 8, donde: 'cantera' },
    'zaino-yegua': { titulo: 'El zaino', texto: 'El zaino es hijo de la yegua «mansa» que Belisario le vendió a Ramón. Salió más manso que la madre.', cap: 8, donde: 'mallín' },
    'llavecita': { titulo: 'La llavecita', texto: 'Herminia me dio una llave de bronce chiquita que encontró de nena en una raíz. No dice a qué puerta abre, pero sabe dónde queda.', cap: 8, donde: 'casa de Herminia' },
  },

  // la línea de «tema de historia» de cada vecino: va arriba de todo en la charla. Se muestra la última del capítulo en que estás (o de uno
  // anterior) cuyo `cuando` se cumpla. `cuando`: { decision, es } o { optativa } o { escena }.
  charla: {
    ramon: [
      { id: 'ramon-c5-zaino', cap: 5, texto: 'El zaino es manso. Si te tira, es porque lo mereciste. Hablale despacio y no lo apures en la cuesta.' },
      { id: 'ramon-c5-en-pie', cap: 5, texto: 'Dejaste el coihue en pie. Eusebio hubiera hecho lo mismo, y habría dicho que era por la sombra.', cuando: { decision: 'coihue', es: 'a' } },
      { id: 'ramon-c5-talado', cap: 5, texto: 'Taló el coihue grande, ¿eh? Cada uno sabe lo suyo. Pero el viento anda raro desde entonces. Digo no más.', cuando: { decision: 'coihue', es: 'b' } },
      { id: 'ramon-c6-ladera', cap: 6, texto: 'Yo de noche duermo. Que no digan que ando por la ladera, que no ando.' },
      { id: 'ramon-c7-minga', cap: 7, texto: 'En la minga todos hacen algo. Hasta el que no hace, hace compañía. Eso también vale.' },
      { id: 'ramon-c8-nieve', cap: 8, texto: 'Se me duelen las rodillas desde hace tres días. Cuando duelen así, nieva en el paso.' },
    ],
    nicanor: [
      { id: 'nicanor-c5-truchas', cap: 5, texto: 'Truchas gordas este año. El lago anda contento, ya te dije.', cuando: { optativa: 'truchas' } },
      { id: 'nicanor-c5-molino', cap: 5, texto: 'Dicen que el molino volvió a moler. Hace ruido de piedra. A las truchas les gusta, o al menos no se quejan.' },
      { id: 'nicanor-c6-luces', cap: 6, texto: 'Las luces salieron anoche otra vez, cerca del faro, siempre cerca del faro. Cuando quieras vamos en kayak, pero remás vos.' },
      { id: 'nicanor-c6-foto', cap: 6, texto: '¿Sacaste la foto? Seguro salió movida. A mí también me sale movida y no tengo ni cámara.', cuando: { escena: 'el-que-vuela' } },
      { id: 'nicanor-c7-ramal', cap: 7, texto: 'Graciela me preguntó cuántas truchas mando a Esquel por mes. Le dije que depende del humor del lago. Anotó «variable».' },
      { id: 'nicanor-c8-frio', cap: 8, texto: 'Se me congela la caña. Es la señal: ya vienen los fríos. Los del lago se van a dormir y los del cerro se despiertan.' },
    ],
    josefina: [
      { id: 'josefina-c5-molino', cap: 5, texto: 'El molino anda bien. Ojo con los cangrejos del arroyo: se acomodan en la rueda.' },
      { id: 'josefina-c5-en-pie', cap: 5, texto: 'Dejaste el coihue en pie. Todavía no sé cómo agradecértelo sin que suene a discurso.', cuando: { decision: 'coihue', es: 'a' } },
      { id: 'josefina-c5-talado', cap: 5, texto: 'No tengo ganas de hablar del coihue. Mejor hablemos de otra cosa. De cualquier cosa.', cuando: { decision: 'coihue', es: 'b' } },
      { id: 'josefina-c5-pirca', cap: 5, texto: 'La pirca me gustó. Tobías tiene manos de las que no mienten.', cuando: { decision: 'coihue', es: 'c' } },
      { id: 'josefina-c6-piso', cap: 6, texto: 'Ando mirando el piso de noche. No me preguntes qué busco. Vos tampoco me contás tus huellas.' },
      { id: 'josefina-c7-minga', cap: 7, texto: 'En la minga vi a Ramón dándole una pala a Fermín. Tanto decirse con una pala.' },
      { id: 'josefina-c8-contar', cap: 8, texto: 'Ya lo dijiste. Está dicho. Ahora a ver qué hace la gente con lo dicho.', cuando: { decision: 'cuaderno', es: 'a' } },
      { id: 'josefina-c8-callar', cap: 8, texto: 'Gracias por callar. Fue lo mejor, creo. O no. Todavía no sé.', cuando: { decision: 'cuaderno', es: 'b' } },
      { id: 'josefina-c8-carta', cap: 8, texto: 'Escribí a la universidad. Dos líneas. Me costó cuatro horas.', cuando: { decision: 'cuaderno', es: 'c' } },
    ],
    ercilia: [
      { id: 'ercilia-c5-molino', cap: 5, texto: 'Un molino de verdad. Cuarenta años sin uno. Se huele pan hasta en el fondo de las cajas.' },
      { id: 'ercilia-c5-masa', cap: 5, texto: 'Rosa dice que la masa madre está más rara que nunca. Yo le digo que se calme, que es solo masa.', cuando: { decision: 'bolsa', es: 'b' } },
      { id: 'ercilia-c6-cuchara', cap: 6, texto: 'Sigue apareciendo cosa perdida por todos lados. Ayer encontré una cuchara en la lata de yerba. La cuchara no es mía.' },
      { id: 'ercilia-c7-fletes', cap: 7, texto: 'Fletes a Esquel… ya, ya, no me quejo. Pero que alcance también para nosotros.', cuando: { decision: 'molienda', es: 'a' } },
      { id: 'ercilia-c7-fiado', cap: 7, texto: 'Mi libreta de fiado nunca estuvo tan contenta. Nélida suma con una sonrisa, que es peligroso.', cuando: { decision: 'molienda', es: 'b' } },
      { id: 'ercilia-c7-partir', cap: 7, texto: 'De todo un poco, dijiste. Esa es la regla de oro del almacén, querido.', cuando: { decision: 'molienda', es: 'c' } },
      { id: 'ercilia-c8-cuenta', cap: 8, texto: 'La cuenta de «los de la raíz» está igual. Pero ahora la miro con otros ojos. Con los tuyos, creo.', cuando: { escena: 'libreta-fiado' } },
    ],
    fermin: [
      { id: 'fermin-c5-habas', cap: 5, texto: 'Me contaron del molino. Voy a pasar con una bolsa de habas a ver cómo muele.' },
      { id: 'fermin-c6-ovejas', cap: 6, texto: 'Esta semana dos ovejas se juntaron junto al coihue viejo y se quedaron mirando. Dos horas. No balaron.' },
      { id: 'fermin-c7-pala', cap: 7, texto: 'Ramón y yo palamos juntos y no nos dijimos nada. Es nuestra manera de decir mucho.' },
      { id: 'fermin-c7-habla', cap: 7, texto: 'Gracias por no decir. Capaz cuando llegue el invierno lo hablo yo.', cuando: { optativa: 'fermin-habla' } },
      { id: 'fermin-c8-belisario', cap: 8, texto: 'Belisario volvió a escribirme. Con letra mala, pero firme. Tengo hasta la primera nevada.' },
    ],
    herminia: [
      { id: 'herminia-c5-molino', cap: 5, texto: 'Un molino de nuevo. Mi marido decía que el valle sin molino es un cuerpo sin pulso.' },
      { id: 'herminia-c6-cosas', cap: 6, texto: 'Se pierden cosas, ¿no? Eso es buena señal. Cuando no se pierde nada, es que no hay nadie en casa.' },
      { id: 'herminia-c7-rueda', cap: 7, texto: 'Cuidado con las ruedas que giran sin que nadie las empuje. Digo que es el agua. Pero lo digo bajito.' },
      { id: 'herminia-c8-cuaderno', cap: 8, texto: 'Ochenta y nueve años y me da cosa ver el cuaderno de Eusebio. Cosa buena, de las que se huelen.' },
      { id: 'herminia-c8-llave', cap: 8, texto: 'Mi llavecita en tu repisa. Me siento mejor, como si hubiera dejado una valija pesada.', cuando: { optativa: 'noventa' } },
    ],
    rosa: [
      { id: 'rosa-c5-trigo', cap: 5, texto: 'Las habas tienen su gracia, pero yo quiero trigo. Dicen que Eusebio molía las dos cosas.' },
      { id: 'rosa-c6-masa', cap: 6, texto: 'Mi masa madre sigue creciendo de noche. Ahora la dejo con un pan al lado. Se acabaron los deditos.', cuando: { decision: 'bolsa', es: 'b' } },
      { id: 'rosa-c6-noche', cap: 6, texto: 'Gracias por quedarte esa noche. Dormir sola con el horno me dio una vergüenza rara, y vos la hiciste más corta.', cuando: { optativa: 'masa-crece' } },
      { id: 'rosa-c7-domingo', cap: 7, texto: 'Con la harina del molino hago el pan del domingo. Va a ser mejor que el de Esquel. Te lo digo sin modestia.' },
      { id: 'rosa-c8-horno', cap: 8, texto: 'Pan para la minga, pan para el fogón, pan para los de la raíz. Alguien va a tener que hacerme un horno más grande.' },
    ],
    elsa: [
      { id: 'elsa-c5-piedra', cap: 5, texto: 'Dicen que el molino anda. Cuando algo anda en este valle, el tren lo escucha. Anoche escuché una piedra grande.' },
      { id: 'elsa-c6-luces', cap: 6, texto: 'Pasajero, ¿vio las luces sobre el lago desde el tren? Yo las vi dos veces. Las anoté en el libro de a bordo como «reflejos».' },
      { id: 'elsa-c7-fletes', cap: 7, texto: 'Tres fletes, qué mañana. El tren ronroneaba. Si fuera gato le daba leche.', cuando: { decision: 'molienda', es: 'a' } },
      { id: 'elsa-c7-riel', cap: 7, texto: 'La harina va por el valle y no por el riel. Bueno, ya me acostumbraré. Algún día.' },
      { id: 'elsa-c8-planilla', cap: 8, texto: 'Graciela vuelve el viernes. Me dijo que hay algo en la planilla que no le cierra. Me da miedo preguntar qué.' },
    ],
    graciela: [
      { id: 'graciela-c5-activo', cap: 5, texto: 'El molino es un activo. Un activo que muele y nada más, por ahora. Pero el ramal vive de lo que se mueve.' },
      { id: 'graciela-c6-varios', cap: 6, texto: 'Anoté tres incidentes inexplicables en el valle esta semana. Los puse en «varios». Es el casillero más honesto de la planilla.' },
      { id: 'graciela-c7-seis', cap: 7, texto: 'Seis bolsas a Esquel. Es más de lo que carga el ramal en una semana de enero. Voy a necesitar otra columna.', cuando: { decision: 'molienda', es: 'a' } },
      { id: 'graciela-c8-fogon', cap: 8, texto: 'Vi el fogón desde atrás. Yo no creo en duendes. Pero anoté los horarios por las dudas.', cuando: { escena: 'fogon-leyenda' } },
    ],
    tito: [
      { id: 'tito-c5-talado', cap: 5, texto: 'Las tablas de ese coihue son una joya. Y no duermo bien desde que las corté. Culpa de nadie, digo. Culpa del viento.', cuando: { decision: 'coihue', es: 'b' } },
      { id: 'tito-c5-en-pie', cap: 5, texto: 'El aserradero camina mucho, pero camina. Un día de estos le pongo un carro.', cuando: { decision: 'coihue', es: 'a' } },
      { id: 'tito-c5-pirca', cap: 5, texto: 'Una pirca para una raíz. Le pedí a Tobías un cantito para mí. Dijo que ni a un conocido.', cuando: { decision: 'coihue', es: 'c' } },
      { id: 'tito-c6-martillo', cap: 6, texto: 'Mi martillo apareció en el techo de la carpintería. Un martillo no sube solo. Se lo pregunté al aire y el aire se rió.' },
      { id: 'tito-c8-mesa', cap: 8, texto: 'Estoy haciendo una mesa grande para el fogón. Larga. Que entren todos, hasta los que no vienen.' },
    ],
    tobias: [
      { id: 'tobias-c5-pirca', cap: 5, texto: 'Gracias por las piedras. Una pirca para una raíz es lo más lindo que me pidieron en años.', cuando: { decision: 'coihue', es: 'c' } },
      { id: 'tobias-c6-veta', cap: 6, texto: 'La veta volvió a llenarse anoche. Se lo cuento a todos y nadie me cree. A vos sí, no sé por qué.' },
      { id: 'tobias-c7-pirca', cap: 7, texto: 'Fui a ver la pirca. Respira. Ya te dije que respiraba.', cuando: { decision: 'coihue', es: 'c' } },
      { id: 'tobias-c8-cantos', cap: 8, texto: 'Los cantos blancos que te llevaste, guardalos. Un día vas a necesitar tirar uno, y va a ser con cariño.', cuando: { optativa: 'veta-vuelve' } },
    ],
    belisario: [
      { id: 'belisario-c5-zaino', cap: 5, texto: 'Dicen que el zaino lo tenés vos. ¡Cuidalo! Cuando se enoja, se queda parado y no hay fuerza que lo mueva.' },
      { id: 'belisario-c6-pipa', cap: 6, texto: 'Me desapareció la pipa. Me apareció en la vía, lista para fumar. Yo no fumo desde marzo, pero la tomé. Cosas de este valle.' },
      { id: 'belisario-c7-fermin', cap: 7, texto: 'Fermín es buen muchacho. Las mulas lo quieren, y eso es mucho decir.' },
      { id: 'belisario-c8-nieve', cap: 8, texto: 'Cuando la nieve tapa el paso, el mundo se achica. Los de abajo se quedan abajo y los de arriba bajan. Siempre fue así.' },
    ],
  },
};

// ---------------------------------------------------------------- consultas
const cap = (n) => (Object.hasOwn(TEXTO_ACTO2.capitulos, n) ? TEXTO_ACTO2.capitulos[n] : null);
const valor = (decisiones, d) => (decisiones && Object.hasOwn(decisiones, d) ? decisiones[d] : null);
const esABC = (v) => v === 'a' || v === 'b' || v === 'c';

// La entrada de un capítulo como lista de párrafos. `puerta`: 'temprano' | 'tarde' para el capítulo 5 (la puerta de estación); con
// 'temprano' es SOLO la tarjeta corta de espera. Si el capítulo tiene `entradaSegun`, suma el párrafo de la decisión.
export function entradaDe2(n, decisiones = {}, { puerta = null } = {}) {
  const c = cap(n);
  if (!c) return [];
  if (puerta === 'temprano' && c.puerta) return [...c.puerta.temprano];
  const r = [...c.entrada];
  if (puerta === 'tarde' && c.puerta) r.unshift(...c.puerta.tarde);
  const s = c.entradaSegun;
  if (s) { const v = valor(decisiones, s.d); if (esABC(v)) r.push(s[v]); }
  return r;
}
// El cierre de un capítulo como lista de párrafos, con la variante de la decisión (`decisiones`: { bolsa, coihue, molienda, cuaderno })
export function cierreDe2(n, decisiones = {}) {
  const c = cap(n);
  if (!c) return [];
  const r = [...c.cierre.base];
  const s = c.cierre.segun;
  if (s) { const v = valor(decisiones, s.d); if (esABC(v)) r.push(s[v]); }
  return r;
}
// El premio como texto de la tarjeta, con lo que suma la decisión
export function premioDe2(n, decisiones = {}) {
  const c = cap(n);
  if (!c) return '';
  const p = c.premio;
  const s = p.segun;
  if (s) { const v = valor(decisiones, s.d); if (esABC(v)) return `${p.texto}. ${s[v]}`; }
  return p.texto;
}
// La página de tratos del cuaderno: la frase de cada decisión que ya se tomó
export function paginaTratosDe2(decisiones = {}) {
  const n = TEXTO_ACTO2.notas['pagina-tratos'];
  const r = [...n.texto];
  for (const d of Object.keys(n.segun)) { const v = valor(decisiones, d); if (esABC(v)) r.push(n.segun[d][v]); }
  return r;
}
// La línea de «tema de historia» de un vecino en el capítulo `cap`: la última cuyo capítulo ya llegó y cuya condición se cumple.
// `estado`: { decisiones: {}, optativas: Set|array, escenas: Set|array }
export function charlaDe2(quien, capitulo, estado = {}) {
  const lista = Object.hasOwn(TEXTO_ACTO2.charla, quien) ? TEXTO_ACTO2.charla[quien] : [];
  const tiene = (conj, id) => (conj instanceof Set ? conj.has(id) : Array.isArray(conj) && conj.includes(id));
  const ok = (l) => {
    if (l.cap > capitulo) return false;
    const w = l.cuando;
    if (!w) return true;
    if (w.decision) return !!estado.decisiones && estado.decisiones[w.decision] === w.es;
    if (w.optativa) return tiene(estado.optativas, w.optativa);
    if (w.escena) return tiene(estado.escenas, w.escena);
    return true;
  };
  const validas = lista.filter(ok);
  if (!validas.length) return null;
  const tope = Math.max(...validas.map((l) => l.cap));
  const delTope = validas.filter((l) => l.cap === tope);
  return delTope.find((l) => l.cuando) || delTope[0];
}
