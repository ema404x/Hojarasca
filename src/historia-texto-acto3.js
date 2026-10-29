// 4.17.0 (B): los textos del ACTO III de la Historia («El trato del molino», capítulos 9 a 13) como DATOS: tarjetas de entrada (con la puerta de
// estación del capítulo 9 y variantes por decisión y por el trato) y de cierre (por D5, por el trato y por cómo salió la noche), objetivos,
// optativas, premios, notas y cartas que se leen, objetos, el cuaderno de lo raro (con el mismo id que los efectos `raro:<id>` de las escenas), la
// charla «tema de historia» de los vecinos, los dos finales armados con piezas y los créditos de la historia. Módulo puro. Lo escribe el agente B;
// lo enchufa el agente A. Sin inglés: se traduce todo al final. Misma forma que historia-texto-acto2.js, con estas diferencias:
//   · `entradaSegun` / `cierre.segun` miran una decisión (d: 'majada' | 'cuaderno' …); `segunTrato` mira el trato con los duendes ('trato' | 'pelea');
//     `segunNoche` mira cómo salió la noche ('ganada' | 'perdida');
//   · los finales no son una tarjeta fija sino piezas (`finalDe3(estado)`), según el trato, la noche, el ramal, las decisiones y los lazos.
// Decisiones: D1 `bolsa`, D2 `coihue`, D3 `molienda`, D4 `cuaderno`, D5 `majada` ('a' | 'b' | 'c'); D6 es `duendes.trato`: 'trato' | 'fuerte' | 'pelea'.

export const TEXTO_ACTO3 = {
  capitulos: {
    9: {
      n: 9, id: 'frios', titulo: 'Los primeros fríos', acto: 3, estacion: 'invierno', dia: 9, minutos: '30 / 40',
      entrada: [
        'El balde amaneció con una tela de hielo y el aliento se ve. En la aldea dicen que Ramón no bajó con la majada.',
        'Ramón baja siempre. Ramón bajó el día que se le murió el perro.',
      ],
      puerta: {
        temprano: ['Todavía hay hojas coloradas en el suelo. Ramón dice que el invierno de verdad empieza con la primera helada: esperá a que el balde amanezca con hielo.'],
        tarde: ['El otoño se te fue sin pedir permiso y el frío ya llegó, antes de lo previsto. El balde amaneció con una helada que no figuraba en ningún pronóstico.'],
      },
      entradaSegun: {
        d: 'cuaderno',
        a: 'En la aldea ya nadie baja la voz para decir «los de la raíz». Se habla de ellos como de un vecino de otra cuadra.',
        b: 'Los que saben, saben; los otros preguntan por Ramón y miran para el cerro sin decir nada.',
        c: 'Josefina espera una carta de Bariloche. Mientras tanto, ensaya la respuesta con el sombrero puesto.',
      },
      objetivos: [
        { id: 'subir', texto: 'Subí al Puesto Alto: Ramón no bajó con la majada', tecla: 'E' },
        { id: 'majada', texto: 'Decidí quién sube con la majada de Ramón y cumplilo', tecla: 'E' },
        { id: 'ramon', texto: 'Llevá a Ramón a la aldea, al puesto sanitario, en el carro o en la trochita', tecla: 'E' },
        { id: 'invierno', texto: 'Prepará tu invierno: seis troncos secos en la leñera, una estufa a leña y abrigo', tecla: 'O' },
      ],
      optativas: [
        { id: 'papel-elsa', texto: 'El papel de Elsa: se le cayó en el andén algo que no querría que viera nadie' },
        { id: 'visita-ramon', texto: 'Visitá a Ramón en el puesto sanitario con algo rico' },
        { id: 'trochita-nieve', texto: 'La trochita en la nieve: el encargo de temporada suma al ramal' },
        { id: 'juntar-ovejas', texto: 'Juntar las ovejas desparramadas (sólo si la tranquera amaneció abierta)' },
      ],
      premio: {
        texto: 'Seis troncos secos y medio kilo de yerba', cuenta: { yerba: 1 }, materiales: { tronco: 6 }, desbloqueo: 'lana-y-vellones',
        segun: {
          d: 'majada',
          a: 'Fermín te vende lana a precio de amigo, para el poncho y la cuerda del arco.',
          b: 'La majada de Ramón te da vellones mientras la cuidás.',
          c: 'Y los pesos de la venta, que no te hacen sentir mejor.',
        },
      },
      cierre: {
        base: [
          'Esa noche nevó finito. Volviendo al refugio con el farol, viste que por la rendija de tu galpón salía luz. Una luz amarilla, temblona, como de muchas velitas. Y risas. Muchas risas, bajitas, como de gente que se tapa la boca.',
          'Dejaste el farol en el suelo. Te sacaste los guantes. Y fuiste.',
        ],
        segun: {
          d: 'majada',
          a: 'En el cerro, un fogoncito. Fermín, con la majada, cuida el rumbo de la noche.',
          b: 'A lo lejos, en el corral, una oveja baló dos veces, como pidiendo que no te vayas.',
          c: 'Atrás, en la loma, un hombre con una boina en la mano miraba un galpón vacío.',
        },
      },
    },
    10: {
      n: 10, id: 'golpea', titulo: 'Golpeá antes de abrir', acto: 3, estacion: 'invierno', dia: 10, minutos: '25 / 30',
      entrada: [
        'La placa de la plaza lo dice clarito: «Golpeá antes de abrir».',
        'Tu galpón tiene luz adentro, risas bajitas y olor a harina. Es tu galpón. Pero esta noche no está tan claro de quién es.',
      ],
      entradaSegun: {
        d: 'majada',
        a: 'Fermín duerme en el galpón de esquila, con las ovejas. No sabe lo que pasa en el tuyo.',
        b: 'Las ovejas de Ramón duermen en tu corral y balan bajito, sin ganas de enterarse.',
        c: 'Sin majada, el Puesto Alto está callado. Vos estás más solo que nunca.',
      },
      objetivos: [
        { id: 'golpe', texto: 'Andá al galpón y golpeá la puerta antes de abrir', tecla: 'E' },
        { id: 'duendes', texto: 'Decidí qué hacés con los que están adentro: trato o pelea', tecla: 'E' },
        { id: 'cerro', texto: 'A la mañana, subí al mirador a ver el cerro', tecla: 'E' },
        { id: 'mesa', texto: 'Juntá a los vecinos en tu mesa, a partir de las 16', tecla: 'E' },
      ],
      optativas: [
        { id: 'llave-79', texto: 'La llave del 79: probala en las cerraduras del valle (sólo si hubo trato)' },
        { id: 'pedir-perdon', texto: 'Pedir perdón: dejá algo en la raíz del coihue (sólo si los echaste)' },
      ],
      premio: {
        texto: 'Nada material', cuenta: {}, desbloqueo: 'lado-del-arroyo',
        segunTrato: {
          trato: 'La llave del 79, de hierro, con aceite fresco en el ojo.',
          pelea: 'Ninguno. La puertita al revés queda en tu galpón.',
        },
      },
      cierre: {
        base: [
          'Afuera nevaba despacio. En la nieve nueva había huellas chiquitas que salían del galpón y se perdían en la noche.',
        ],
        segunTrato: {
          trato: 'Las huellas salían del galpón en fila y se perdían en la raíz del coihue. Ninguna volvía. Todas estaban tranquilas, si es que las huellas pueden estar tranquilas.',
          pelea: 'Las huellas salían corriendo para todos lados. Una sola fila iba despacio, derecho al cerro: la del grande. Era la única que no tenía miedo.',
        },
      },
    },
    11: {
      n: 11, id: 'arco', titulo: 'El arco y la honda', acto: 3, estacion: 'invierno', dia: 11, minutos: '35 / 45',
      entrada: [
        'Nadie en el valle tiene armas. Hay hachas, palas, cañas, un rifle viejo de Belisario que no tira desde 1970. Pero Josefina tira con arco desde los quince, Fermín le pega a una lata a treinta metros con la honda, y en la aldea cada uno tiene algo para prestar.',
        'Hay dos días hasta la nevada grande. Alcanza, si se empieza ya.',
      ],
      entradaSegun: {
        d: 'majada',
        a: 'Fermín te espera en el galpón de esquila con la honda al hombro. Tiene ganas de enseñar, que en él es raro.',
        b: 'Fermín anda callado con el cuero en la mano. No te lo va a pedir, pero tampoco te lo va a negar.',
        c: 'Fermín no te saluda. Para llegar a la honda hay que pasar primero por una paz que cuesta.',
      },
      segunTrato: {
        trato: 'Los duendecitos del trato te dejaron piñones en el umbral. Tal vez sepan que van a necesitar tu ayuda.',
        pelea: 'Del lado del arroyo, a la noche, se oyen pasos que tantean. Vienen mirando las defensas.',
      },
      objetivos: [
        { id: 'arco', texto: 'El arco: lenga, cuerda, puntas, plumas, y cinco blancos en el Puesto del Paso', tecla: 'E' },
        { id: 'honda', texto: 'La honda: aprender con Fermín y voltear cinco latas en la esquila', tecla: 'E' },
        { id: 'prestado', texto: 'Pedí tres cosas prestadas para la noche: estacas, miel, campana, durmientes', tecla: 'E' },
        { id: 'deuda', texto: 'Si el trato quedó a deber algo, pagalo (no traba)', tecla: 'E' },
        { id: 'recorrer', texto: 'Recorré el lado del arroyo con Ramón o con Josefina', tecla: 'E' },
      ],
      optativas: [
        { id: 'flechas-de-mas', texto: 'Flechas de más: con más plumas y puntas, Tito te arma un segundo atado' },
        { id: 'cumple-nevada', texto: 'El cumpleaños que no se suspende: ir igual, aunque haya nevada' },
        { id: 'alguien-te-espera', texto: 'Alguien que te espera: una cita corta la noche antes (sólo con el amor prendido)' },
      ],
      premio: { texto: 'El arco y la honda, que quedan en la mochila (después de la historia, colgados en la pared del refugio)', cuenta: {}, objetos: ['arco', 'honda'], desbloqueo: 'arsenal-prestado' },
      cierre: {
        base: [
          'La radio del Cerro Negro lo dijo tres veces: nevada grande en la cordillera, baja al valle esta noche. Ercilia cerró temprano. Los chicos de los Jones pegaron la nariz al vidrio. Ramón pidió que lo llevaran al refugio «para mirar, nomás». Josefina se trajo el sombrero.',
          'Afuera empezó a nevar. Grueso, esta vez.',
        ],
        segunTrato: {
          trato: 'Detrás tuyo, en las raíces, algo se movía con cuidado, como quien acomoda una silla para sentarse en el fondo.',
          pelea: 'Del otro lado del arroyo, entre los árboles, se oían ramas que se quebraban una a una, despacio.',
        },
      },
    },
    12: {
      n: 12, id: 'nevada', titulo: 'La noche de la nevada', acto: 3, estacion: 'invierno', dia: 12, minutos: '25 / 30',
      entrada: [
        'Nieva como si el cielo se estuviera vaciando. En el valle, las luces de las casas se apagan una por una: la gente se junta en la estación, cerca de la salamandra, como en las noches bravas de antes.',
        'En tu galpón está la harina del invierno. Detrás, el arroyo, negro, haciendo ruido entre la nieve.',
      ],
      segunTrato: {
        trato: 'Esta noche los que bajan son los del cerro: los más viejos, los que tienen hambre. Los chiquitos de las raíces no vienen contra vos.',
        pelea: 'Esta noche bajan todos: los de las raíces y los del cerro. Los echaste y volvieron juntos.',
      },
      objetivos: [
        { id: 'cena', texto: 'Comé algo caliente: un guiso, un locro o trucha con papas', tecla: 'E' },
        { id: 'estacion', texto: 'Llevá a Herminia y a los chicos de los Jones a la estación', tecla: 'E' },
        { id: 'galpon-22', texto: 'Estate en el galpón a las 22 con el arco y la honda', tecla: 'E' },
        { id: 'noche', texto: 'Defendé el galpón de la nevada', tecla: '·' },
        { id: 'amanecer', texto: 'Mirá el amanecer', tecla: '·' },
      ],
      optativas: [],
      premio: {
        texto: 'Según cómo termine la noche', cuenta: {},
        segunTrato: {
          trato: 'La llave del molino viejo, si no la usaste, y el canto blanco gemelo del de tu umbral.',
          pelea: 'Seis troncos y harina de los vecinos: lo de la solidaridad.',
        },
        desbloqueo: 'epilogo',
      },
      cierre: {
        base: [
          'Ganes o pierdas, la noche pasó. Siempre pasan.',
          'Quedó la nieve, quedaron las huellas y quedó un valle que se quedó despierto con vos.',
        ],
        segunNoche: {
          ganada: 'La campana sonó larga una sola vez. Nadie pudo dormir después de eso, pero nadie quiso.',
          perdida: 'Perdiste, y se notó. Pero con un galpón mal clavado y los vecinos haciendo guiso de nuevo, se parecía a una casa.',
        },
      },
    },
    13: {
      n: 13, id: 'deshielo', titulo: 'El deshielo', acto: 3, estacion: 'invierno', dia: 12, minutos: '20 / 30',
      entrada: [
        'Pasó una semana del valle. La nieve se puso dura y brillante, y en la aldea preparan la Fiesta de la Nieve.',
        'Graciela llegó en el tren de la mañana. No trae el portafolios: trae una carpeta celeste, cerrada con elástico.',
      ],
      segunTrato: {
        trato: 'En el umbral, a la mañana, siguen apareciendo cosas chicas, acomodadas con cuidado.',
        pelea: 'El umbral amanece vacío, limpio, como un plato lavado después de una mala cena.',
      },
      objetivos: [
        { id: 'carpeta', texto: 'Andá al andén a recibir a Graciela', tecla: 'E' },
        { id: 'majada-fin', texto: 'Visitá a Ramón y a Fermín', tecla: 'E' },
        { id: 'fiesta', texto: 'Andá a la Fiesta de la Nieve, en el predio de la aldea', tecla: 'E' },
        { id: 'josefina-fin', texto: 'Pasá la tarde con Josefina junto al coihue', tecla: 'E' },
        { id: 'umbral-fin', texto: 'Dormí y despertá el primer día del año', tecla: 'E' },
      ],
      optativas: [
        { id: 'volver-a-subir', texto: 'Volver a subir: llevale el mate a Ramón a la loma y esperá a que hable (sólo si vendiste la majada)' },
      ],
      premio: {
        texto: 'El arco y la honda, colgados en la pared del refugio, y el título de perfil «Del valle»', cuenta: {}, objetos: ['arco', 'honda'], desbloqueo: 'juego-libre',
        segunTrato: {
          trato: 'La puertita de la repisa se abre: adentro hay un piñón tostado. Y cada cosecha, la bolsa vacía en el umbral.',
          pelea: 'El canto blanco queda en la repisa, para acordarte.',
        },
      },
      cierre: {
        base: [
          'La historia termina acá, pero el valle no. Queda todo por andar. Tomate tu tiempo: acá nadie tiene apuro, y el que tiene, se le pasa.',
        ],
      },
    },
  },

  // lo que se lee: cartas, carteles, papeles y las páginas nuevas del cuaderno
  notas: {
    'placa-plaza': { titulo: 'La placa de la plaza', texto: ['Golpeá antes de abrir.'] },
    'papel-ramon': { titulo: 'El papel de Ramón', texto: ['Yo, Ramón, firmo que el que tiene este papel puede disponer de la majada del Puesto Alto «como mejor convenga». Y que no me pregunten por qué.', 'La firma tiene un manchón de mate.'] },
    'pedido-traslado': { titulo: 'El pedido de traslado de Elsa', texto: ['Solicito traslado a Esquel. Firmado: Elsa, guarda del ramal.', 'Está doblado en cuatro y tiene una huella de hollín.'] },
    'informe-cierre': { titulo: 'El informe de cierre', texto: ['Ramal del valle. Carga mensual media: doce toneladas. Carga necesaria: cuarenta. Se recomienda el cierre.', 'Firmado: G. Pugh. En el margen, a lápiz y muy chico: «Salvo que».'] },
    'anexo-graciela': { titulo: 'El anexo a mano de Graciela', texto: ['Anexo al informe. Hay algo que no figura en la planilla y se llama valle.', 'Se solicita un año a prueba. G. P.'] },
    'ficha-cauquen': { titulo: 'La ficha del cauquén', texto: ['Cauquén común. Junio. Lago. Hallado sin vida, sin signos de caza.', 'Lo enterré cerca del muelle. J.'] },
    'postal-fermin': { titulo: 'La postal de Fermín', texto: ['Acá también hay viento. Pero no es el mismo. F.'] },
    'cartel-catrileo': { titulo: 'El cartel del puesto', texto: ['PUESTO CATRILEO.', 'Pintado a mano, con una oveja de cuatro patas y una sonrisa.'] },
    'cartel-arbol': { titulo: 'El cartel del árbol', texto: ['ÁRBOL NOTABLE. NO TOCAR.', 'De chapa esmaltada, atornillada al tronco del coihue.'] },
    'cuaderno-4': { titulo: 'El cuaderno de Eusebio: la última hoja', texto: ['Si leés esto, ya pasó la noche. No sé cómo pasó. No sé si pasó bien. Pero estás leyendo, y eso ya es un modo de que haya pasado.', 'No les tengas miedo, no les tengas confianza: tené trato. Con los de abajo y con los de arriba. Y con los vecinos, que son los más difíciles.', 'La puerta se deja entornada. Y gracias. E. M.'] },
    'pagina-tratos-3': {
      titulo: 'Página de tratos: lo que sigue',
      texto: ['Lo que se dejó en el invierno, con la letra de Eusebio.'],
      segun: {
        majada: {
          a: 'La majada subió con quien la conoce. Anotado.',
          b: 'La majada la cuidó quien llegó último. Anotado con cariño.',
          c: 'La majada se vendió. Anotado con letra chica.',
        },
      },
      segunTrato: {
        trato: 'Se abrió la puerta y se esperó sentado. Anotado con letra grande.',
        pelea: 'Se cerró la puerta a los gritos. Anotado. Y debajo: «Fijate quién cerró primero».',
      },
    },
  },

  // la descripción de los objetos de historia (cuando los mirás en la mochila o en la repisa)
  objetos: {
    'llave-79': { nombre: 'La llave del 79', texto: 'Una llave grande de hierro, con aceite fresco en el ojo. En la lista de Eusebio figura como «la llave que perdí en el 79». Abre un cajón trabado junto a las muelas del molino viejo.' },
    'foto-de-tres': { nombre: 'La foto de los tres', texto: 'Color té, doblada en las puntas. Tres hombres jóvenes con una bolsa de trigo al hombro: Eusebio, el abuelo de Josefina y Ramón, riéndose de algo que quedó fuera del cuadro.' },
    'canto-gemelo': { nombre: 'El canto gemelo', texto: 'Un canto rodado blanco, liso como un huevo. Es el hermano del que dormía en tu repisa, y se nota: pesan lo mismo.' },
    'mate-de-chocolate': { nombre: 'El mate de Chocolate', texto: 'Una calabacita tallada con un perro dibujado en el costado. Ramón la cuidó cuarenta años. Todavía guarda el olor del primer mate.' },
    'silbato-de-elsa': { nombre: 'El silbato de Elsa', texto: 'El silbato de guarda del ramal, de bronce, tibio de tanto llevarlo en el bolsillo. «Manéjelo con las orejas. Y escríbame.»' },
    'cuaderno-del-abuelo': { nombre: 'El cuaderno del abuelo', texto: 'De tapas de tela gastadas en las puntas. Dibujos de puertitas en las raíces, con sus medidas. Josefina lo dejó en tu repisa, al lado del canto blanco.' },
    'arco': { nombre: 'El arco de lenga', texto: 'Flexible y terco, como la gente de acá. Tiene una cuerda de lana encerada y un nombre grabado del lado de adentro, donde nadie ve.' },
    'honda': { nombre: 'La honda de cuero', texto: 'Cuero trenzado y dos tientos largos. No se apunta: se siente.' },
  },

  // el cuaderno de lo raro: indicios con fecha y lugar. Los ids son los de los efectos `raro:<id>` de las escenas.
  raro: {
    'ramon-en-cama': { titulo: 'Ramón en cama', texto: 'Fiebre y la cadera. Dos semanas de reposo, dice Marta. Ramón dice que todo es negociable, menos la majada.', cap: 9, donde: 'Puesto Alto' },
    'majada-decision': { titulo: '¿Quién sube con la majada?', texto: 'Tres caminos y ninguno es solo de la majada: también son de Ramón, de Fermín y de lo que le pasó a cada uno.', cap: 9, donde: 'Puesto Alto' },
    'majada-llevada': { titulo: 'La majada, entera', texto: 'Fermín la llevó al galpón de esquila. No se va con Belisario. Ramón dijo «no me la devuelvas flaca».', cap: 9, donde: 'galpón de esquila' },
    'majada-cuidada': { titulo: 'Tres días de majada', texto: 'Agua con hielo, forraje en la espalda. Ramón vino en el carro a mirar. Fermín me miró de lejos y no dijo nada.', cap: 9, donde: 'corral de Ramón' },
    'majada-vendida': { titulo: 'La majada, vendida', texto: 'Belisario pagó bien. Fermín me dio la espalda. Ramón no me miró. Lo anoto con letra chica.', cap: 9, donde: 'Puesto del Paso' },
    'hojas-de-canelo': { titulo: 'Hojas de canelo', texto: 'Alguien dejó un atado de canelo y un yuyo pálido en la puerta del Puesto Alto. Marta dice que es lo que ella le iba a dar.', cap: 9, donde: 'Puesto Alto' },
    'corral-abierto': { titulo: 'La tranquera abierta', texto: 'Las ovejas desparramadas, huellas chiquitas en el barro. No se llevaron nada: lo dejaron mal puesto.', cap: 9, donde: 'corral de Ramón' },
    'papel-de-elsa': { titulo: 'El papel de Elsa', texto: 'Un pedido de traslado a Esquel, caído en el andén. Se lo devolví. Ya no me dice pasajero.', cap: 9, donde: 'Estación del Valle' },
    'chocolate': { titulo: 'Chocolate', texto: 'Un perro pardo con una mancha blanca en el pecho. A las seis de la tarde a Ramón todavía le pica la mano.', cap: 9, donde: 'puesto sanitario' },
    'golpe-galpon': { titulo: 'Golpeá antes de abrir', texto: 'Golpeé la puerta de mi propio galpón. Se hizo un silencio total y se abrió sola, un palmo.', cap: 10, donde: 'mi galpón' },
    'sin-golpear': { titulo: 'Sin golpear', texto: 'Abrí sin golpear y se apagó la luz. Diez segundos de oscuridad y una risa. Bien merecido.', cap: 10, donde: 'mi galpón' },
    'once-en-el-galpon': { titulo: 'Once en el galpón', texto: 'Pillos, saltarines, duendecitos de luz, un yuyero y un topo, todos sentados en ronda alrededor de mis bolsas. Y el Mandamás, arriba de una. No hablaron.', cap: 10, donde: 'mi galpón' },
    'nos-dimos-la-mano': { titulo: 'Nos dimos la mano', texto: 'Bueno: me tocaron la bota. Creo que es lo mismo. Me dejaron una llave de hierro.', cap: 10, donde: 'mi galpón' },
    'nadie-me-pego': { titulo: 'Nadie me pegó', texto: 'Nadie me pegó. Nadie me robó. Pero hay algo roto y no sé qué es. En la puerta, una puertita clavada al revés.', cap: 10, donde: 'mi galpón' },
    'viejos-del-cerro': { titulo: 'Los del cerro', texto: 'En la nieve, muy arriba, formas oscuras en fila, más grandes que los de las raíces. Cuando la nieve tape el paso, bajan.', cap: 10, donde: 'mirador del pehuén' },
    'mesa-de-guerra': { titulo: 'La mesa de guerra, sin guerra', texto: 'Todos alrededor del mapa del valle. Nadie tiene todo, pero entre todos tenemos todo.', cap: 10, donde: 'refugio' },
    'foto-de-los-tres': { titulo: 'Los tres', texto: 'La llave abrió el cajón del molino viejo. Adentro, una foto de Eusebio, el abuelo de Josefina y Ramón, jóvenes, con una bolsa de trigo.', cap: 10, donde: 'molino viejo' },
    'pedi-perdon': { titulo: 'Pedí perdón', texto: 'Dejé algo en la raíz del coihue. No sé si lo recibieron. Me pareció que alguien se movía del otro lado de la tierra.', cap: 10, donde: 'coihue grande' },
    'arco-de-lenga': { titulo: 'El arco de lenga', texto: 'Tito me dio el arco sin cuerda. Flexible y terco, como la gente de acá. «Trátelo como a un perro viejo.»', cap: 11, donde: 'carpintería' },
    'plumas-del-bosque': { titulo: 'Plumas del bosque', texto: 'Junté seis plumas del monte. Josefina me lo recordó: las plumas se quedan en el bosque.', cap: 11, donde: 'bosque' },
    'plumas-del-gallinero': { titulo: 'Plumas del gallinero', texto: 'Junté seis plumas de mis gallinas. Josefina dijo «mirá vos, aprendiste».', cap: 11, donde: 'gallinero' },
    'plumas-de-la-seccional': { titulo: 'La colección de la seccional', texto: 'Plumas con ficha: dónde, cuándo, de qué. Una es de un cauquén del invierno pasado. Que sirva para algo.', cap: 11, donde: 'seccional' },
    'arco-practicado': { titulo: 'Cinco blancos de paja', texto: 'Erré los primeros y le pegué a los últimos. Belisario aplaudió y me pidió que no le dispare a las mulas.', cap: 11, donde: 'Puesto del Paso' },
    'paces-con-fermin': { titulo: 'Las paces', texto: 'Le llevé algo rico a Fermín. Aceptó sin mirarme y, después de un rato largo, aflojó.', cap: 11, donde: 'galpón de esquila' },
    'honda-con-fermin': { titulo: 'La honda no se apunta', texto: 'Fermín revolea el cuero tres veces y suelta. Una lata salta del poste. «Se siente.»', cap: 11, donde: 'galpón de esquila' },
    'honda-practicada': { titulo: 'Cinco latas', texto: 'Cinco latas en los postes del galpón. Fermín dijo «ya está, eso se lleva en el brazo para siempre».', cap: 11, donde: 'galpón de esquila' },
    'cuerda-de-elvira': { titulo: 'La cuerda de Elvira', texto: 'Dos vellones y un pan de cera. Una cuerda fina como un pelo y fuerte como un nudo de marinero.', cap: 11, donde: 'hilandería' },
    'puntas-de-anselmo': { titulo: 'Doce puntas', texto: 'Anselmo forjó doce puntas parejas. Hacer una buena es fácil; hacer doce iguales es oficio.', cap: 11, donde: 'herrería' },
    'estacas-prestadas': { titulo: 'Estacas de arado', texto: 'Anselmo me prestó estacas de hierro viejo. Duras como el que las forjó.', cap: 11, donde: 'lado del arroyo' },
    'trampas-de-miel': { titulo: 'Trampas de miel', texto: 'Dos frascos de miel de ulmo, para frenar un rato a los chicos. Guido: «Que no se la coman».', cap: 11, donde: 'lado del arroyo' },
    'campana-vieja': { titulo: 'La campana del taller', texto: 'Martín presta la campana de bronce verde. Sonó dos veces en cuarenta años. Ahora va a sonar una tercera.', cap: 11, donde: 'galpón' },
    'durmientes-de-elsa': { titulo: 'Durmientes del ramal', texto: 'Dieciséis durmientes de lenga, de la vía vieja. «Que sirvan de algo, que de tren ya no sirven.»', cap: 11, donde: 'lado del arroyo' },
    'pirca-reforzada': { titulo: 'La pirca, reforzada', texto: 'Tobías le sumó dos hileras de piedras a la pirca del coihue. Sin que yo se lo pidiera.', cap: 11, donde: 'coihue grande' },
    'deuda-pagada': { titulo: 'Lo que se debía', texto: 'Dejé en la raíz lo que el trato pedía. A la mañana, ya no estaba. Queda saldado.', cap: 11, donde: 'coihue grande' },
    'recorrer-el-lado': { titulo: 'El lado del arroyo', texto: 'Estacas, miel, campana y durmientes, cada cosa en su lugar. Se parece más a una fiesta que a una defensa.', cap: 11, donde: 'lado del arroyo' },
    'flechas-de-mas': { titulo: 'Flechas de más', texto: 'Tito armó un segundo atado, derecho como una regla. Con eso alcanzamos hasta el alba.', cap: 11, donde: 'carpintería' },
    'cumple-sin-suspender': { titulo: 'El cumpleaños', texto: 'Fui igual a la torta, aunque viniera la nevada. Los chicos preguntaron por los duendes grandes.', cap: 11, donde: 'almacén' },
    'cita-antes-de-la-nevada': { titulo: 'La noche antes', texto: 'Té, una manta, un silencio largo y una luz que quedó prendida un rato más que las otras.', cap: 11, donde: 'su lugar favorito' },
    'cena-antes-de-la-nevada': { titulo: 'La cena', texto: 'Nadie pelea con la panza vacía. Comimos despacio, sin decir nada importante. Fue lo más importante.', cap: 12, donde: 'refugio' },
    'herminia-y-la-nevada': { titulo: 'Herminia y la nevada', texto: 'Llevé a Herminia y a los chicos de los Jones a la estación. Dice que de chica pasó una igual y miró. Qué bueno que miró.', cap: 12, donde: 'Estación del Valle' },
    'la-espera': { titulo: 'La espera', texto: 'Nieve gruesa, defensas armadas, los míos en su lugar y la campana tocando tres veces. Empieza.', cap: 12, donde: 'mi galpón' },
    'primera-ola': { titulo: 'La primera ola', texto: 'Se fue como llegó: de golpe, con una estaca torcida. Veintidós flechas rescatadas de la nieve.', cap: 12, donde: 'lado del arroyo' },
    'segunda-ola': { titulo: 'La segunda ola', texto: 'De madrugada. El arco me pesa. El silencio del viento significa que se están juntando.', cap: 12, donde: 'lado del arroyo' },
    'noche-ganada': { titulo: 'Se acabó', texto: 'Nevó hasta que dejó de nevar. Me senté en la nieve al lado del arco y nadie me necesitó para nada, por primera vez en horas.', cap: 12, donde: 'mi galpón' },
    'noche-perdida': { titulo: 'Sin aire', texto: 'Me quedé sin aire, sentado en la nieve, y el galpón crujió. Nadie se lastimó. Dejé que amaneciera.', cap: 12, donde: 'mi galpón' },
    'amanecer-del-trato': { titulo: 'El amanecer del trato', texto: 'Los del cerro subieron la ladera despacio. Las lucecitas rodearon el galpón. El de la gorra torcida dejó un canto blanco, gemelo del de mi umbral.', cap: 12, donde: 'mi galpón' },
    'amanecer-torcido': { titulo: 'Un amanecer torcido', texto: 'El galpón medio caído, la harina en la nieve y los chicos arreglándolo con tablas torcidas clavadas con espinas de calafate.', cap: 12, donde: 'mi galpón' },
    'amanecer-de-la-pelea': { titulo: 'Ganamos', texto: 'El Mandamás se fue último, se dio vuelta y bajó la cabeza. No sé si fue derrota o despedida. Josefina preguntó por qué no se sentía como ganar.', cap: 12, donde: 'borde del bosque' },
    'amanecer-de-todos': { titulo: 'Acá perdemos todos', texto: 'El galpón vacío, las puertas abiertas, huellas al cerro. Los vecinos llegaron con bolsas. «Entre todos, un poquito es poco.»', cap: 12, donde: 'mi galpón' },
    'carpeta-celeste': { titulo: 'La carpeta celeste', texto: 'Graciela abrió la carpeta en el andén, delante de todos. Hay informes que se rompen y hay informes que se firman a mano.', cap: 13, donde: 'Estación del Valle' },
    'los-de-la-majada': { titulo: 'Los de la majada', texto: 'Ramón y Fermín, cada uno con lo suyo. Lo que se regala diciendo que ya era tuyo, se regala mejor.', cap: 13, donde: 'galpón de esquila' },
    'volver-a-subir': { titulo: 'Volver a subir', texto: '«La majada era una excusa. Lo que no quería era quedarme solo.» Me quedé una hora sentado al lado, sin hablar.', cap: 13, donde: 'loma' },
    'josefina-y-el-cuaderno': { titulo: 'Josefina y el cuaderno', texto: 'Lo que Josefina hizo con el cuaderno de su abuelo, al lado del coihue. Ahora es oficial. Ahora sí da miedo.', cap: 13, donde: 'coihue grande' },
    'fiesta-de-la-nieve': { titulo: 'La Fiesta de la Nieve', texto: 'Farolitos de papel, ollas humeantes, un acordeón. Hace un año no conocía a nadie. Hoy conozco las caras de todos.', cap: 13, donde: 'predio de la aldea' },
    'umbral-del-final': { titulo: 'El umbral', texto: 'El primer día del año, la misma luz, el mismo escalón. El círculo se cierra.', cap: 13, donde: 'refugio' },
    'costumbre-bolsa': { titulo: 'La bolsa de la cosecha', texto: 'Llené la bolsa vacía con harina de mi muela y la dejé en el escalón. Nadie la ve irse.', cap: 13, donde: 'refugio' },
    'regalito': { titulo: 'El regalito', texto: 'A la mañana, en el escalón, algo chiquito acomodado con cuidado. Lo que se deja, vuelve.', cap: 13, donde: 'refugio' },
  },

  // la línea de «tema de historia» de cada vecino: va arriba de todo en la charla. Se muestra la última del capítulo en que estás (o de uno
  // anterior) cuyo `cuando` se cumpla. `cuando`: { decision, es } | { optativa } | { escena } | { trato: 'trato' | 'pelea' } | { noche: 'ganada' | 'perdida' }.
  charla: {
    ramon: [
      { id: 'ramon-c9-cama', cap: 9, texto: 'Todo es negociable, m\'hijo. Menos la majada. Bueno… menos la majada y la cadera, que ya no negocia.' },
      { id: 'ramon-c9-fermin', cap: 9, texto: 'A Fermín lo vi salir con la majada. No lo vi mirar atrás. Así se sale cuando se hace bien.', cuando: { decision: 'majada', es: 'a' } },
      { id: 'ramon-c9-vendida', cap: 9, texto: 'No me hables de la majada. Hablame del clima, de las rodillas, de lo que quieras. De eso no.', cuando: { decision: 'majada', es: 'c' } },
      { id: 'ramon-c10-galpon', cap: 10, texto: 'Dicen que había luz en tu galpón anoche. Yo no digo nada. Pero la yerba, ¿se la dejaste en la raíz?' },
      { id: 'ramon-c11-martillo', cap: 11, texto: 'Si me sientan con un martillo, hago lo que haga falta. Que no me traten de inválido: me traten de viejo, que es otra cosa.' },
      { id: 'ramon-c12-noche', cap: 12, texto: 'Ahora sí que me duele la cadera. Pero estoy acá, que es lo que importa. Mate cebado, lavado no.' },
      { id: 'ramon-c13-nieve', cap: 13, texto: 'Esta nieve que se derrite es nieve vieja. La nueva la trae el año que viene. Siempre fue así.' },
    ],
    nicanor: [
      { id: 'nicanor-c9-hielo', cap: 9, texto: 'El lago se congeló en la orilla. Las truchas están adentro, quietas, esperando. Yo también.' },
      { id: 'nicanor-c10-luz', cap: 10, texto: 'Anoche vi una luz amarilla en tu galpón desde el muelle. Pensé: ¿para qué será tanta luz? Después me acordé de que no pregunto.' },
      { id: 'nicanor-c11-lago', cap: 11, texto: 'Las luces del lago se apagaron estos días. Mala señal o buena, según quién mire. Yo miro y no opino.' },
      { id: 'nicanor-c12-ola', cap: 12, texto: 'La noche pasada se oyó la campana hasta el muelle. Tres veces. Después hubo un silencio que me dio miedo por dentro.', cuando: { noche: 'ganada' } },
      { id: 'nicanor-c13-luces', cap: 13, texto: 'Volvieron las luces sobre el lago. Y ahora cuando las cuento, nadie se ríe. Es una venganza tranquila.', cuando: { trato: 'trato' } },
    ],
    josefina: [
      { id: 'josefina-c9-frio', cap: 9, texto: 'Ahora que hace frío los bichos están más cerca. Anoche vi huellas de pie descalzo en la nieve. Descalzo, con este frío.' },
      { id: 'josefina-c10-trato', cap: 10, texto: 'Los viste de cerca. A mí no me tocaron la bota, pero casi. Lo que más me impresionó fue que se fueron en fila.', cuando: { trato: 'trato' } },
      { id: 'josefina-c10-pelea', cap: 10, texto: 'No te juzgo. No quiero juzgarte. Pero ahora hay algo roto en el valle y me gustaría saber si se arregla.', cuando: { trato: 'pelea' } },
      { id: 'josefina-c11-plumas', cap: 11, texto: 'Las plumas se juntan una por una, y se dicen gracias en voz baja. Lo demás es ciencia, pero esto no.' },
      { id: 'josefina-c12-arco', cap: 12, texto: 'Tengo las manos duras de la cuerda. Mañana no voy a poder abrocharme los botones. Vale la pena.' },
      { id: 'josefina-c13-cuaderno', cap: 13, texto: 'Mi abuelo tendría que haber visto esto. Los chicos dibujando puertitas. Cualquier cosa menos tocarlas.', cuando: { decision: 'cuaderno', es: 'a' } },
      { id: 'josefina-c13-cuaderno-b', cap: 13, texto: 'El cuaderno está mejor en tu repisa. Lo mirás de vez en cuando, ¿no? Eso alcanza.', cuando: { decision: 'cuaderno', es: 'b' } },
    ],
    ercilia: [
      { id: 'ercilia-c9-invierno', cap: 9, texto: 'El invierno se mete en las cajas de la yerba. Hay que tener lista la libreta del fiado y mucho mate.' },
      { id: 'ercilia-c10-vela', cap: 10, texto: 'Prendí una vela en la ventana del almacén por las dudas. No digo por qué. Es una costumbre, nada más.' },
      { id: 'ercilia-c11-prestado', cap: 11, texto: 'Anselmo prestó estacas, Guido miel, Martín la campana. Nadie dijo «¿y qué me das?». Eso es un valle.' },
      { id: 'ercilia-c12-estacion', cap: 12, texto: 'Qué noche. Cerré el almacén y me vine con las latas de duraznos. Si hay que durar, se dura con duraznos.' },
      { id: 'ercilia-c13-fiesta', cap: 13, texto: 'Esta Fiesta de la Nieve es la más grande en años. Nélida lo anotó, y la letra le tembló.', cuando: { decision: 'molienda', es: 'b' } },
      { id: 'ercilia-c13-tren', cap: 13, texto: 'La trochita pasa todos los días y la aldea vuelve a respirar. No lo digas mucho, que se asusta.' },
    ],
    fermin: [
      { id: 'fermin-c9-a', cap: 9, texto: 'Gracias por la majada. La cuido como si fuera mía. No lo es, pero se parece.', cuando: { decision: 'majada', es: 'a' } },
      { id: 'fermin-c9-c', cap: 9, texto: 'No tengo nada para decirle. Capaz mañana.', cuando: { decision: 'majada', es: 'c' } },
      { id: 'fermin-c10-honda', cap: 10, texto: 'Si necesita la honda, avise. No se la voy a negar. Aunque me hubiera gustado que me la pidiera antes.' },
      { id: 'fermin-c11-latas', cap: 11, texto: 'Cinco latas y sin errar el último. Hay gente que nace con la mano. Hay gente que se la hace. Usted se la hizo.', cuando: { escena: 'blancos-esquila' } },
      { id: 'fermin-c12-techo', cap: 12, texto: 'Desde el techo se veía todo. La próxima me traigo una manta, un termo y una radio.', cuando: { noche: 'ganada' } },
      { id: 'fermin-c13-puesto', cap: 13, texto: 'Puesto Catrileo. Suena bien, ¿no? Ramón dice que el cartel está torcido. Es su manera de decir que le gusta.', cuando: { decision: 'majada', es: 'a' } },
    ],
    herminia: [
      { id: 'herminia-c9-cocina', cap: 9, texto: 'Prendí la salamandra de la cocina. Voy a dejar la puerta con llave, pero no del lado de adentro.' },
      { id: 'herminia-c10-luz', cap: 10, texto: 'Anoche vi la luz en tu galpón por la ventana. Me quedé mirando. No me asusté. Me dieron ganas de salir con una torta.' },
      { id: 'herminia-c12-nieve', cap: 12, texto: 'Cuando era chica pasó una igual. Miré. Qué bueno que miré, m\'hijo.' },
      { id: 'herminia-c13-puerta', cap: 13, texto: 'Dejé la puerta de mi casa entornada. No es por nadie. Es por si vuelve alguien.', cuando: { trato: 'pelea' } },
      { id: 'herminia-c13-trato', cap: 13, texto: 'Qué bueno que hubo trato. Se lo debía el valle desde hace tiempo.', cuando: { trato: 'trato' } },
    ],
    rosa: [
      { id: 'rosa-c9-pan', cap: 9, texto: 'Con el frío el pan sube más lento, pero mejor. Es como la gente: se aprende a esperar.' },
      { id: 'rosa-c10-masa', cap: 10, texto: 'Anoche se me cerró el horno solo. Se lo dije a Ercilia y me dijo «chimangos». Ya no la escucho.' },
      { id: 'rosa-c11-canasta', cap: 11, texto: 'Preparo una canasta de pan para la noche. Que no falte, que el pan sostiene más que la espada.' },
      { id: 'rosa-c12-pan', cap: 12, texto: 'El pan salió mejor que nunca. Capaz porque lo hice enojada.', cuando: { noche: 'perdida' } },
      { id: 'rosa-c13-masa', cap: 13, texto: 'Mi masa madre de 1987 sigue creciendo. Ya aprendió a no tocar el techo.' },
    ],
    elsa: [
      { id: 'elsa-c9-nieve', cap: 9, texto: 'Pasajero… perdón. Por su nombre, ¿se acuerda? No se acostumbre. La nieve en la vía me pone nerviosa y me suelta la lengua.' },
      { id: 'elsa-c10-vagon', cap: 10, texto: 'Anoche el tren se movió solo un palmo. Lo anoté en el libro de a bordo: «viento». La verdad es otra cosa.' },
      { id: 'elsa-c11-durmientes', cap: 11, texto: 'Los durmientes están donde tienen que estar. Si los ve la ingeniera, me despide. Si los ve el valle, me aplaude.' },
      { id: 'elsa-c12-campana', cap: 12, texto: 'La campana de Martín sonó tres veces y el tren pitó solo, de acompañamiento. Cosas de este valle.' },
      { id: 'elsa-c13-ramal', cap: 13, texto: 'El tren pasa, el ramal vive. No me haga hablar de esto, que se me corre el rodete.', cuando: { decision: 'molienda', es: 'a' } },
    ],
    graciela: [
      { id: 'graciela-c9-vagon', cap: 9, texto: 'El invierno recorta la carga. Es una variable estacional. Anoté «estacional» y dibujé una nevada.' },
      { id: 'graciela-c10-luces', cap: 10, texto: 'Vi luces en un galpón anoche. Las anoté en «varios». No quiero saber de qué son.' },
      { id: 'graciela-c11-colecta', cap: 11, texto: 'Hice una lista de lo que cada vecino aportó para la noche. Cuarenta renglones. Cero pesos. Es el balance más raro que firmé.' },
      { id: 'graciela-c12-noche', cap: 12, texto: 'Estuve en la estación durante toda la noche. Anoté los horarios de la campana. Después dejé de anotar y miré.' },
      { id: 'graciela-c13-carpeta', cap: 13, texto: 'La carpeta celeste no tiene casillero de agradecimiento. Lo agrego a mano.' },
    ],
    tito: [
      { id: 'tito-c9-leña', cap: 9, texto: 'Estoy calentando las manos para el arco. Hace años que no hago uno. Las manos se acuerdan antes que la cabeza.' },
      { id: 'tito-c10-lenga', cap: 10, texto: 'Hay una lenga seca en la ladera que parece pedir que la corten. No sé cómo lo sé. Mañana te la marco.' },
      { id: 'tito-c11-arco', cap: 11, texto: 'El arco queda lindo. Lo grabé del lado de adentro con un nombre. No te digo cuál: vas a tener que adivinar.', cuando: { escena: 'tito-arco' } },
      { id: 'tito-c12-mesa', cap: 12, texto: 'La mesa larga resistió la noche. Esta madera es de las que no se ofenden.' },
      { id: 'tito-c13-fiesta', cap: 13, texto: 'Para la fiesta armé una mesa de veinte metros. La mitad me quedó torcida, pero la torcida es la más simpática.' },
    ],
    tobias: [
      { id: 'tobias-c9-cantera', cap: 9, texto: 'En invierno la piedra se calla. Pero hay que saber escucharla. Yo la escucho en los dedos.' },
      { id: 'tobias-c10-veta', cap: 10, texto: 'La veta de cantos blancos se vació anoche. Entera. Qué raro, ¿no? Capaz se los llevaron a otro lado.', cuando: { optativa: 'veta-vuelve' } },
      { id: 'tobias-c11-pirca', cap: 11, texto: 'Si necesita que la pirca aguante más, le agrego unas hileras. Es lo mínimo que puedo hacer por el valle.', cuando: { decision: 'coihue', es: 'c' } },
      { id: 'tobias-c12-piedras', cap: 12, texto: 'Las piedras de la pirca se movieron un centímetro durante la noche. Como si respiraran. Lo medí con la regla.', cuando: { decision: 'coihue', es: 'c' } },
      { id: 'tobias-c13-diolch', cap: 13, texto: 'Diolch, Diolch. Gracias por todo lo que hizo. Mi abuela hubiera estado orgullosa.' },
    ],
    belisario: [
      { id: 'belisario-c9-paso', cap: 9, texto: 'El paso se cierra con la primera nevada. Las mulas lo saben, yo también. Después, el mundo se achica.' },
      { id: 'belisario-c10-oferta', cap: 10, texto: 'Dígale a Fermín que mi oferta sigue en pie hasta que la nieve tape el paso. Después, se acabó.', cuando: { decision: 'majada', es: 'b' } },
      { id: 'belisario-c11-blancos', cap: 11, texto: 'Sus blancos de paja ya están pelados. Si sigue así, le cobro por la paja.' },
      { id: 'belisario-c12-nevada', cap: 12, texto: 'Anoche me quedé con las mulas. Estaban tranquilas. Eso me asustó más que si hubieran estado nerviosas.' },
      { id: 'belisario-c13-mulas', cap: 13, texto: 'Se fue Fermín, pero las mulas no extrañan. Lo extraño yo, que soy sentimental.', cuando: { decision: 'majada', es: 'b' } },
    ],
    marta: [
      { id: 'marta-c9-cadera', cap: 9, texto: 'La cadera de Ramón se cura en dos semanas si se queda quieto. Es decir, nunca. Le doy tres.' },
      { id: 'marta-c10-canelo', cap: 10, texto: 'Ese canelo del umbral era de primera. Lo que no entiendo es quién se tomó el trabajo de ir a buscarlo a la ladera.' },
      { id: 'marta-c11-botiquin', cap: 11, texto: 'Armé un botiquín para la noche: vendas, alcohol, té de manzanilla. Y un mate, por las dudas.' },
      { id: 'marta-c12-guardia', cap: 12, texto: 'Estuve de guardia en la estación. No atendí a nadie. Es la mejor noche de mi carrera.' },
    ],
    anselmo: [
      { id: 'anselmo-c11-estacas', cap: 11, texto: 'Las estacas son de un arado que no quiso trabajar más. Pero dura: la tierra le dio una jubilación.' },
      { id: 'anselmo-c12-hierro', cap: 12, texto: 'Anoche el fuego del taller se prendió solo. No me preocupa. Me preocupa más cuando se apaga.' },
      { id: 'anselmo-c13-yunque', cap: 13, texto: 'Estoy forjando una cosa para la fiesta. No te digo qué. Es chica, brilla y se parece a un sol.' },
    ],
    guido: [
      { id: 'guido-c11-miel', cap: 11, texto: 'Las abejas duermen en racimo. La miel que te presté es de las mejores. Si una se pega al suelo, es culpa de la miel, no mía.' },
      { id: 'guido-c12-colmenas', cap: 12, texto: 'Anoche las colmenas zumbaron más fuerte que de costumbre. Algo las despertó. O las calmó.' },
      { id: 'guido-c13-tarro', cap: 13, texto: 'El tarro que trajeron de vuelta tiene un dedito dibujado en el borde. Lo dejo sin lavar.', cuando: { trato: 'trato' } },
    ],
    elvira: [
      { id: 'elvira-c11-cuerda', cap: 11, texto: 'La cuerda se encera cada noche. Es como cuidar a un animal que no se queja. Dura mucho, pero hay que atenderla.' },
      { id: 'elvira-c12-witral', cap: 12, texto: 'Tejí toda la noche en el witral para no pensar. Salió una guarda con puntas. No sé qué quiere decir.' },
      { id: 'elvira-c13-manta', cap: 13, texto: 'Te tejí una manta para el refugio. Con las guardas de las puertitas. Si no te gusta, la devolvés. Pero no te va a pasar.' },
    ],
    martin: [
      { id: 'martin-c11-campana', cap: 11, texto: 'Mi campana tiene cuarenta años de silencio. Si suena, es porque vale la pena. Y si no vale la pena, también.' },
      { id: 'martin-c12-golpe', cap: 12, texto: 'La toqué tres veces con el pulso quieto. Cuando terminé, me temblaron las manos una hora.' },
      { id: 'martin-c13-taller', cap: 13, texto: 'El taller ferroviario vuelve a oler a aceite fresco. La máquina espera su revisión. Si viene Graciela, la saludo con el silbato.', cuando: { decision: 'molienda', es: 'a' } },
    ],
  },

  // los créditos de la historia (se muestran al terminar, con «Ver los créditos»)
  creditos: [
    'EL TRATO DEL MOLINO',
    'Una historia del valle de Hojarasca.',
    'Con Don Ramón, Josefina, Ercilia, Elsa, Fermín, Graciela y todos los vecinos del valle.',
    'Y con los que no se ven, pero se oyen.',
    'Y gracias.',
  ],

  // las piezas de los finales (se arman en finalDe3 según el estado)
  finales: {
    A: [
      'El trato.',
      'El valle sigue raro. Las herramientas a veces amanecen en otro lado, el pan de Rosa crece de más, Nicanor ve luces sobre el lago y ya nadie se ríe de él. Cada cosecha, una bolsa del molino se deja en el umbral. Nadie la ve irse.',
      'Eusebio tenía razón: no hay que tenerles miedo ni confianza. Hay que tener trato. Como con los vecinos.',
    ],
    B: [
      'La pelea.',
      'El valle quedó tranquilo. Las herramientas amanecen donde las dejás y el pan crece lo que tiene que crecer. A veces, de noche, te parece oír una risa lejos, y te quedás quieto, esperando. Nunca es. O casi nunca.',
      'Herminia dice que los vecinos que se van, a veces vuelven. Que hay que dejar la puerta entornada. Vos la dejás.',
    ],
    ramal: {
      salvado: 'La trochita pasa todos los días, con el silbato largo en la curva del puente. Elsa saluda con la mano.',
      prueba: 'La trochita pasa tres veces por semana. Cada vez que pasa, la mirás hasta que se pierde.',
      traslado: 'La trochita pasa tres veces por semana, y a veces lleva a Elsa de visita. El silbato de guarda cuelga de un clavo en tu pared.',
    },
    majada: {
      a: 'En la estepa hay un puesto nuevo, con un cartel pintado a mano. Ramón lo visita los domingos y lo critica.',
      b: 'La majada de Ramón vuelve cada primavera al Puesto Alto, y a veces una oveja se escapa a mirarte.',
      c: 'Ramón baja a tomar mate de vez en cuando, y nunca habla de la majada. Alcanza con que baje.',
    },
    cuaderno: {
      a: 'En la escuela de la aldea, los chicos dibujan puertitas. Ninguno toca una raíz.',
      b: 'El cuaderno del abuelo de Josefina duerme en tu repisa, al lado del canto blanco. Alguien lo cuida.',
      c: 'El coihue lleva un cartelito de chapa. Cada verano llega una científica con una cinta métrica.',
    },
    bolsa: {
      a: 'El piolín colorado de la primera bolsa quedó enrollado en tu repisa, como una cuenta saldada.',
      b: 'El pan de Rosa sigue siendo el mejor del valle. Ella dice que es la receta; vos sabés que es algo más.',
      c: 'Josefina todavía guarda la nota de Eusebio en el bolsillo de la camisa. A veces la lee en voz baja.',
    },
    coihue: {
      a: 'El coihue sigue en pie, mirando el molino con paciencia de cuatrocientos años.',
      b: 'Del tocón del coihue nacen brotes verdes. Josefina los cuenta, uno por uno, sin decir nada.',
      c: 'La pirca de Tobías abraza la raíz. Cuando sopla el viento, silba un poquito, y nadie la manda a callar.',
    },
    molienda: {
      a: 'Los fletes de harina siguen saliendo hacia Esquel, con constancia. Graciela dice que figuran.',
      b: 'El fiado largo se cobró en primavera, y nadie perdió un peso ni un amigo.',
      c: 'Cada cosecha, una bolsa va a la raíz, una al almacén y una a la estación. Ercilia dice que es la regla de oro.',
    },
    graciela: 'Graciela alquiló una casa cerca de la estación. Dice que es para contar mejor.',
    ramon: 'Ramón te regaló el mate de Chocolate, y cada tarde, a las seis, te lo pide prestado.',
    josefina: 'Josefina escribió tu nombre en la última hoja del cuaderno, con lápiz, por las dudas.',
    elsa: 'Elsa te mandó un telegrama desde Esquel: «Todo bien. El tren va despacio. Y gracias.»',
    noche: 'El galpón tiene una pared nueva, mal clavada. No la cambiaste.',
    perdon: 'En la raíz del coihue sigue la bellota derecha, como un soldadito. Nadie la movió.',
    amor: 'Quien te esperó esa noche te sigue esperando cada tarde, con el té servido y la luz prendida.',
    siempre: 'La historia termina acá, pero el valle no. Queda todo por andar. Tomate tu tiempo: acá nadie tiene apuro, y el que tiene, se le pasa.',
  },
};

// ---------------------------------------------------------------- consultas
const cap = (n) => (Object.hasOwn(TEXTO_ACTO3.capitulos, n) ? TEXTO_ACTO3.capitulos[n] : null);
const valor = (decisiones, d) => (decisiones && Object.hasOwn(decisiones, d) ? decisiones[d] : null);
const esABC = (v) => v === 'a' || v === 'b' || v === 'c';
// el trato visto desde el texto: 'trato' (también el fuerte) | 'pelea' | null
const tratoDe = (t) => (t === 'trato' || t === 'fuerte' ? 'trato' : t === 'pelea' ? 'pelea' : null);

// La entrada de un capítulo como lista de párrafos. `puerta`: 'temprano' | 'tarde' para el capítulo 9 (la puerta de estación); con 'temprano'
// es SOLO la tarjeta corta de espera. `trato`: 'trato' | 'fuerte' | 'pelea'.
export function entradaDe3(n, decisiones = {}, { puerta = null, trato = null } = {}) {
  const c = cap(n);
  if (!c) return [];
  if (puerta === 'temprano' && c.puerta) return [...c.puerta.temprano];
  const r = [...c.entrada];
  if (puerta === 'tarde' && c.puerta) r.unshift(...c.puerta.tarde);
  const s = c.entradaSegun;
  if (s) { const v = valor(decisiones, s.d); if (esABC(v)) r.push(s[v]); }
  const t = tratoDe(trato);
  if (c.segunTrato && t) r.push(c.segunTrato[t]);
  return r;
}
// El cierre de un capítulo como lista de párrafos, con la variante de la decisión, del trato y de la noche
export function cierreDe3(n, decisiones = {}, { trato = null, noche = null } = {}) {
  const c = cap(n);
  if (!c) return [];
  const r = [...c.cierre.base];
  const s = c.cierre.segun;
  if (s) { const v = valor(decisiones, s.d); if (esABC(v)) r.push(s[v]); }
  const t = tratoDe(trato);
  if (c.cierre.segunTrato && t) r.push(c.cierre.segunTrato[t]);
  if (c.cierre.segunNoche && (noche === 'ganada' || noche === 'perdida')) r.push(c.cierre.segunNoche[noche]);
  return r;
}
// El premio como texto de la tarjeta, con lo que suma la decisión o el trato
export function premioDe3(n, decisiones = {}, { trato = null } = {}) {
  const c = cap(n);
  if (!c) return '';
  const p = c.premio;
  const partes = [p.texto];
  if (p.segun) { const v = valor(decisiones, p.segun.d); if (esABC(v)) partes.push(p.segun[v]); }
  const t = tratoDe(trato);
  if (p.segunTrato && t) partes.push(p.segunTrato[t]);
  return partes.join('. ').replace(/\.\./g, '.');
}
// La página de tratos del invierno: la frase del trato con los duendes y la de la majada
export function paginaTratosDe3(decisiones = {}, { trato = null } = {}) {
  const n = TEXTO_ACTO3.notas['pagina-tratos-3'];
  const r = [...n.texto];
  for (const d of Object.keys(n.segun)) { const v = valor(decisiones, d); if (esABC(v)) r.push(n.segun[d][v]); }
  const t = tratoDe(trato);
  if (t) r.push(n.segunTrato[t]);
  return r;
}
// La tarjeta final, armada con piezas. `estado`: { decisiones, trato, noche, ramal, lazos: { ramon, ema, graciela, … }, perdon, amor }
export function finalDe3(estado = {}) {
  const F = TEXTO_ACTO3.finales;
  const dec = estado.decisiones || {}, lazos = estado.lazos || {};
  const pelea = tratoDe(estado.trato) === 'pelea';
  const r = [...(pelea ? F.B : F.A)];
  const ramal = Number.isFinite(Number(estado.ramal)) ? Number(estado.ramal) : 0;
  r.push(F.ramal[ramal >= 10 ? 'salvado' : ramal >= 6 ? 'prueba' : 'traslado']);
  for (const d of ['majada', 'cuaderno', 'bolsa', 'coihue', 'molienda']) { const v = valor(dec, d); if (esABC(v)) r.push(F[d][v]); }
  if ((Number(lazos.graciela) || 0) >= 3) r.push(F.graciela);
  if ((Number(lazos.ramon) || 0) >= 3) r.push(F.ramon);
  if ((Number(lazos.ema) || 0) >= 3) r.push(F.josefina);
  if (ramal < 6 && (Number(lazos.guarda) || 0) >= 1) r.push(F.elsa);
  if (estado.noche === 'perdida') r.push(F.noche);
  if (pelea && estado.perdon === true) r.push(F.perdon);
  if (estado.amor === true) r.push(F.amor);
  r.push(F.siempre);
  return r;
}
// La línea de «tema de historia» de un vecino en el capítulo `cap`: la última cuyo capítulo ya llegó y cuya condición se cumple.
// `estado`: { decisiones: {}, optativas: Set|array, escenas: Set|array, trato: 'trato' | 'fuerte' | 'pelea', noche: 'ganada' | 'perdida' }
export function charlaDe3(quien, capitulo, estado = {}) {
  const lista = Object.hasOwn(TEXTO_ACTO3.charla, quien) ? TEXTO_ACTO3.charla[quien] : [];
  const tiene = (conj, id) => (conj instanceof Set ? conj.has(id) : Array.isArray(conj) && conj.includes(id));
  const ok = (l) => {
    if (l.cap > capitulo) return false;
    const w = l.cuando;
    if (!w) return true;
    if (w.decision) return !!estado.decisiones && estado.decisiones[w.decision] === w.es;
    if (w.optativa) return tiene(estado.optativas, w.optativa);
    if (w.escena) return tiene(estado.escenas, w.escena);
    if (w.trato) return tratoDe(estado.trato) === w.trato;
    if (w.noche) return estado.noche === w.noche;
    return true;
  };
  const validas = lista.filter(ok);
  if (!validas.length) return null;
  const tope = Math.max(...validas.map((l) => l.cap));
  const delTope = validas.filter((l) => l.cap === tope);
  return delTope.find((l) => l.cuando) || delTope[0];
}
