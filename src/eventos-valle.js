// 3.1: los eventos del valle. De vez en cuando, en el Relax, pasa algo y hay que decidir:
// un vecino se lastima, la crecida afloja el puente, se viene un temporal, aparece un
// viajero perdido, hay humo en el bosque. Una tarjeta chica con dos o tres opciones, y
// cada opción hace algo concreto en la partida: cuesta o da materiales, deja a un vecino
// agradecido, salva o voltea algo tuyo, trae una visita o te deja una cosa nueva. Algunas
// consecuencias llegan días después ("lo que pasó después").
//
// Pocos y espaciados: como mucho uno cada tres días, y ese día sólo a veces. Salen de la
// semilla de la partida (dos partidas con la misma semilla ven los mismos días). Nunca en
// el Desafío ni con un menú abierto (eso lo cuida el juego). La historia guiada también
// los usa como momentos de sus capítulos (ver `historia.js`).
//
// Módulo puro (se prueba en Node). Lo que cada efecto hace en el mundo lo aplica el juego
// (ver `eventos-valle-ui.js`); acá sólo se decide qué pasa y cuándo.

export const EVENTOS = {
  cada: 3,          // días como mínimo entre un evento y el siguiente
  chance: 0.45,     // un día que ya puede tocar, la chance de que toque
  desde: 9,         // hora más temprana en que puede aparecer
  ventana: 8,       // horas en las que puede aparecer (9 a 17)
  diaMinimo: 3,     // el primer día que puede haber uno (la llegada es tranquila)
  seguimientoDesde: 7,   // "lo que pasó después" llega de mañana en adelante
  regalo: 3,        // gratitud que hace falta para que el vecino te deje algo especial
};

const QUIEN = { ramon: 'Don Ramón', nicanor: 'Nicanor', ema: 'Ema', ercilia: 'Ercilia', guarda: 'Elsa' };
export const nombreVecinoEvento = (k) => (Object.hasOwn(QUIEN, k) ? QUIEN[k] : k);

// Lo que pide una opción: { materiales: { tabla: 2 }, cuenta: { yerba: 1 }, ramitas: 3 }.
// Lo que hace: una lista de efectos.
//   { tipo: 'dar', premio: { materiales, cuenta, ramitas, cosa, texto } }
//   { tipo: 'gratitud', quien, n }
//   { tipo: 'horas', n }                el tiempo que te lleva
//   { tipo: 'lena', mojada: true }      la leña que llevás se moja (o se salva)
//   { tipo: 'helada' }                  la huerta de afuera se hiela
//   { tipo: 'voltear' }                 el viento voltea una pieza chica tuya
//   { tipo: 'cosa', id, sino }          una cosa nueva (o, si ya la tenés, `sino`)
//   { tipo: 'visita', quien }           el vecino viene a tu mesa esa tarde (si hay mesa puesta)
//   { tipo: 'poblador' }                corre la voz: el próximo poblador viene sin esperar (ver pueblo.js)
// `luego`: consecuencias para días después: [{ dias, id }] (ver SEGUIMIENTOS).
export const EVENTOS_VALLE = [
  {
    id: 'tobillo', titulo: 'Nicanor en la orilla', quien: 'nicanor', vecinos: true,
    texto: 'Bajando al muelle ves a Nicanor sentado en una piedra, agarrándose el tobillo. «Me resbalé en el verdín como un gurí», dice, medio riéndose y medio no. «No es nada. Creo.»',
    cuando: () => true,
    opciones: [
      { id: 'llevar', texto: 'Ayudarlo a llegar hasta su casa, despacio', detalle: 'Te lleva un par de horas', efectos: [{ tipo: 'horas', n: 2 }, { tipo: 'gratitud', quien: 'nicanor', n: 2 }],
        diario: 'Nicanor se torció el tobillo en el muelle. Lo acompañé hasta su casa, paso a paso, charlando de truchas para que no pensara en el dolor.',
        luego: [{ dias: 2, id: 's-tobillo-cana' }] },
      { id: 'vendar', texto: 'Entablillarlo ahí mismo con dos tablas y tu pañuelo', detalle: 'Rápido, pero cuesta dos tablas', pide: { materiales: { tabla: 2 } },
        efectos: [{ tipo: 'gratitud', quien: 'nicanor', n: 1 }],
        diario: 'Le entablillé el tobillo a Nicanor con dos tablas y un pañuelo. Dice que quedó mejor que en el hospital de Bariloche.',
        luego: [{ dias: 1, id: 's-tobillo-truchas' }] },
      { id: 'avisar', texto: 'Ir a buscar a Ema, que tiene el botiquín del parque', detalle: 'Ella sabe qué hacer', efectos: [{ tipo: 'gratitud', quien: 'ema', n: 1 }],
        diario: 'Nicanor se lastimó en el muelle y fui a buscar a Ema. Llegó corriendo con el botiquín.',
        luego: [{ dias: 1, id: 's-tobillo-ema' }] },
    ],
  },
  {
    id: 'puente', titulo: 'El puente del arroyo', quien: 'ramon',
    texto: 'La crecida de anoche le comió la tierra a uno de los estribos del puente del arroyo. Quedó torcido, con una tabla colgando sobre el agua marrón. Todavía se puede pasar, pero cruje.',
    cuando: (s) => s.dia >= 4,
    opciones: [
      { id: 'arreglar', texto: 'Arreglarlo vos: calzar el estribo con piedra y cambiar las tablas', detalle: 'Seis tablas y cuatro piedras', pide: { materiales: { tabla: 6, piedra: 4 } },
        efectos: [{ tipo: 'horas', n: 2 }, { tipo: 'gratitud', quien: 'ramon', n: 2 }],
        diario: 'Arreglé el puente del arroyo. Calcé el estribo con piedra y cambié las tablas podridas. Ahora no cruje.',
        luego: [{ dias: 3, id: 's-puente-ramon' }] },
      { id: 'cartel', texto: 'Poner un cartel de «cuidado» y avisar en el almacén', detalle: 'Una tabla para el cartel', pide: { materiales: { tabla: 1 } },
        efectos: [{ tipo: 'gratitud', quien: 'ercilia', n: 1 }],
        diario: 'Puse un cartel en el puente flojo y avisé en el almacén. Ercilia dijo que iba a llamar a Vialidad.',
        luego: [{ dias: 2, id: 's-puente-vialidad' }] },
      { id: 'nada', texto: 'Dejarlo así: ya lo van a arreglar', detalle: 'No cuesta nada… por ahora', efectos: [],
        diario: 'El puente del arroyo quedó torcido después de la crecida. Lo crucé igual.',
        luego: [{ dias: 2, id: 's-puente-caida' }] },
    ],
  },
  {
    id: 'temporal', titulo: 'Se viene un temporal', quien: 'ramon',
    texto: 'El cielo sobre la cordillera se puso de un gris que no es el de siempre y las bandurrias pasan gritando para el lado del lago. Ramón baja con la majada antes de hora: «Esta noche sopla fuerte. Asegurá lo tuyo».',
    // de verdad: sólo cuando el pronóstico de la estación anuncia tormenta o viento fuerte
    cuando: (s) => !!s.pronostico?.temporal, repite: 12,
    opciones: [
      { id: 'atar', texto: 'Atar y trabar todo lo que está suelto afuera', detalle: 'Dos tablas y una hora; la leña que llevás se moja', pide: { materiales: { tabla: 2 } },
        efectos: [{ tipo: 'horas', n: 1 }, { tipo: 'lena', mojada: true }],
        diario: 'Se venía el temporal y até todo lo que estaba suelto. La leña me quedó afuera y se mojó.',
        luego: [{ dias: 1, id: 's-temporal-atado' }] },
      { id: 'lena', texto: 'Entrar la leña bajo techo y cerrar bien la casa', detalle: 'La leña queda seca; lo de afuera, a la buena de Dios', efectos: [{ tipo: 'lena', mojada: false }],
        diario: 'Entré la leña antes del temporal y cerré bien. Lo de afuera quedó librado a su suerte.',
        luego: [{ dias: 1, id: 's-temporal-volteo' }] },
      { id: 'nada', texto: 'No hacer nada: siempre dicen lo mismo', detalle: 'Puede salir caro', efectos: [{ tipo: 'lena', mojada: true }],
        diario: 'Ramón avisó que venía un temporal. No le hice caso.',
        luego: [{ dias: 1, id: 's-temporal-todo' }] },
    ],
  },
  {
    id: 'viajero', titulo: 'Un viajero perdido',
    texto: 'Por el sendero viene un muchacho con una mochila enorme, un mapa mojado y cara de no saber dónde está. «¿Esto es el valle? Me dijeron que había un refugio y una estación, y ya no sé para qué lado.»',
    cuando: (s) => s.dia >= 3 && s.horas >= 12,
    opciones: [
      { id: 'acompanar', texto: 'Acompañarlo hasta la estación', detalle: 'Te lleva dos horas', efectos: [{ tipo: 'horas', n: 2 }],
        diario: 'Acompañé a un viajero perdido hasta la estación. Venía de Córdoba, caminando la cordillera.',
        luego: [{ dias: 3, id: 's-viajero-botas' }] },
      { id: 'fuego', texto: 'Convidarlo con mate y que duerma junto a tu fuego', detalle: 'Un poco de yerba; un visitante esta noche', pide: { cuenta: { yerba: 1 } },
        efectos: [{ tipo: 'dar', premio: { ramitas: 4, texto: 'El viajero juntó leña para el fuego' } }],
        diario: 'Un viajero perdido se quedó a dormir junto a mi fuego. Tomamos mate hasta tarde y me contó de los glaciares del norte.',
        luego: [{ dias: 1, id: 's-viajero-semillas' }] },
      { id: 'indicar', texto: 'Indicarle el camino en su mapa', detalle: 'Rápido', efectos: [],
        diario: 'Le marqué el camino en el mapa a un viajero perdido. Espero que haya llegado.',
        luego: [{ dias: 1, id: 's-viajero-ema' }] },
    ],
  },
  {
    id: 'incendio', titulo: 'Humo en el bosque', quien: 'ema',
    texto: 'Entre los coihues sube una columna de humo blanco, finita. Alguien dejó un fuego mal apagado y el viento lo está avivando entre la hojarasca seca.',
    cuando: (s) => s.dia >= 5 && !s.lluvia,
    opciones: [
      { id: 'apagar', texto: 'Correr a apagarlo con tierra y ramas verdes', detalle: 'Una hora de trabajo duro', efectos: [{ tipo: 'horas', n: 1 }, { tipo: 'gratitud', quien: 'ema', n: 2 }],
        diario: 'Apagué un fuego mal apagado en el bosque, a paladas de tierra. Llegué a tiempo: se quemó apenas un claro.',
        luego: [{ dias: 2, id: 's-incendio-ema' }] },
      { id: 'avisar', texto: 'Ir a avisarle a Ema', detalle: 'Ella tiene la mochila de agua', efectos: [{ tipo: 'gratitud', quien: 'ema', n: 1 }],
        diario: 'Vi humo en el bosque y corrí a avisarle a Ema. Lo apagaron entre ella y los brigadistas.',
        luego: [{ dias: 1, id: 's-incendio-quemado' }] },
    ],
  },
  {
    id: 'oveja', titulo: 'La oveja de Ramón', quien: 'ramon', vecinos: true,
    texto: 'Una oveja con la marca de Ramón en la oreja anda sola, balando, subiendo para el cerro. Se escapó de la majada y va derecho a las piedras, donde andan los zorros.',
    cuando: (s) => s.dia >= 3, repite: 15,
    opciones: [
      { id: 'buscar', texto: 'Arrearla vos hasta el Puesto Alto', detalle: 'Te lleva dos horas', efectos: [{ tipo: 'horas', n: 2 }, { tipo: 'gratitud', quien: 'ramon', n: 1 }],
        diario: 'Una oveja de Ramón se había escapado. La arreé hasta el puesto; es más porfiada que una mula.',
        luego: [{ dias: 1, id: 's-oveja-lana' }] },
      { id: 'perro', texto: 'Mandarle al perro, que sabe', detalle: 'Rápido, pero el perro es el perro', efectos: [],
        diario: 'Mandé al perro a traer una oveja escapada de Ramón. Volvió sin la oveja y muy contento.',
        luego: [{ dias: 1, id: 's-oveja-perro' }] },
    ],
  },
  {
    id: 'musicos', titulo: 'Música en la estación',
    texto: 'En el andén de la estación hay tres músicos con una guitarra, un bombo legüero y un acordeón. Bajan de la veranada y piden permiso para quedarse una noche: «Si hay fogón, hay música».',
    cuando: (s) => s.dia >= 6 && s.horas >= 11,
    opciones: [
      { id: 'fiesta', texto: 'Invitarlos a tocar en tu fogón y llamar a los vecinos', detalle: 'Dos medidas de harina para las tortas fritas', pide: { cuenta: { harina: 2 } },
        efectos: [{ tipo: 'gratitud', quien: 'ramon', n: 1 }, { tipo: 'gratitud', quien: 'nicanor', n: 1 }, { tipo: 'gratitud', quien: 'ema', n: 1 }, { tipo: 'gratitud', quien: 'ercilia', n: 1 }],
        diario: 'Hubo guitarreada en mi fogón. Vinieron todos los vecinos; Ramón bailó una chacarera y después dijo que no.',
        luego: [{ dias: 1, id: 's-musicos-fiesta' }] },
      { id: 'yerba', texto: 'Convidarles yerba para el viaje', detalle: 'Un poco de yerba', pide: { cuenta: { yerba: 2 } }, efectos: [],
        diario: 'Unos músicos de la veranada pasaron por la estación. Les di yerba para el camino y me tocaron una zamba.',
        luego: [{ dias: 2, id: 's-musicos-carta' }] },
      { id: 'no', texto: 'Hoy no: estás cansado', detalle: 'Nada', efectos: [],
        diario: 'Había músicos en la estación. Los escuché de lejos.' },
    ],
  },
  {
    id: 'huemul', titulo: 'Un huemul enredado', quien: 'ema',
    texto: 'En un alambrado viejo, de los de antes del parque, un huemul joven quedó enganchado de una pata. Está quieto, mirándote, con los ojos enormes. Si se asusta, se lastima más.',
    cuando: (s) => s.dia >= 4,
    opciones: [
      { id: 'soltar', texto: 'Acercarte despacio y cortar el alambre', detalle: 'Una hora, con mucho cuidado', efectos: [{ tipo: 'horas', n: 1 }, { tipo: 'gratitud', quien: 'ema', n: 2 }],
        diario: 'Solté un huemul joven que estaba enganchado en un alambrado. Se fue despacio, mirando para atrás.',
        luego: [{ dias: 2, id: 's-huemul-ema' }] },
      { id: 'ema', texto: 'Ir a buscar a Ema y no tocarlo', detalle: 'Lo que dicen los guardaparques', efectos: [{ tipo: 'gratitud', quien: 'ema', n: 1 }],
        diario: 'Encontré un huemul enredado en un alambre y fui a buscar a Ema. Lo soltaron entre dos.',
        luego: [{ dias: 1, id: 's-huemul-alambre' }] },
    ],
  },
  {
    id: 'derrumbe', titulo: 'Piedras en la vía', quien: 'guarda',
    texto: 'La trochita está parada en medio del bosque, con el silbato sonando corto. Un derrumbe tapó la vía con piedras. Elsa se asoma: «¡Una mano, que así no llegamos a la otra parada!».',
    cuando: (s) => s.dia >= 4 && !!s.viaje,
    opciones: [
      { id: 'ayudar', texto: 'Ayudar a despejar la vía', detalle: 'Dos horas de acarrear piedra', efectos: [{ tipo: 'horas', n: 2 }, { tipo: 'gratitud', quien: 'guarda', n: 1 }, { tipo: 'dar', premio: { materiales: { piedra: 8 }, texto: 'Te quedaste con ocho piedras buenas del derrumbe' } }],
        diario: 'Un derrumbe tapó la vía de la trochita. Ayudé a despejarla y me quedé con unas piedras lindas para la casa.',
        luego: [{ dias: 2, id: 's-derrumbe-ramal' }] },
      { id: 'seguir', texto: 'Seguir tu camino: ya se arreglarán', detalle: 'Nada', efectos: [],
        diario: 'Vi la trochita parada por un derrumbe. Seguí de largo.' },
    ],
  },
  {
    id: 'almacen', titulo: 'Ercilia tiene que ir al pueblo', quien: 'ercilia', vecinos: true,
    texto: 'Ercilia te para en la puerta del almacén, con el sombrero puesto: «Tengo que ir al pueblo por un trámite y no tengo con quién dejar esto. ¿Me lo cuidás un rato? Es atender y no regalar nada».',
    cuando: (s) => s.dia >= 5 && s.horas < 15,
    opciones: [
      { id: 'cuidar', texto: 'Quedarte atendiendo el almacén la tarde', detalle: 'Tres horas detrás del mostrador', efectos: [{ tipo: 'horas', n: 3 }, { tipo: 'gratitud', quien: 'ercilia', n: 2 }],
        diario: 'Atendí el almacén de Ercilia toda la tarde. Vendí dos paquetes de yerba y una lata de duraznos, y anoté todo en el cuaderno de fiado.',
        luego: [{ dias: 1, id: 's-almacen-harina' }] },
      { id: 'no', texto: 'Decirle que hoy no podés', detalle: 'Nada', efectos: [],
        diario: 'Ercilia necesitaba que le cuidara el almacén. Hoy no pude.' },
    ],
  },
  {
    id: 'helada', titulo: 'Se viene una helada fuerte',
    texto: 'El aire está quieto y demasiado limpio, y el sol se fue temprano detrás del cerro. Esta noche va a helar fuerte. Lo sembrado afuera, en los canteros, no lo va a pasar bien.',
    cuando: (s) => s.sembrados >= 1 && !!s.pronostico?.helada, repite: 10,
    opciones: [
      { id: 'tapar', texto: 'Tapar los canteros con tablas y paja', detalle: 'Dos tablas', pide: { materiales: { tabla: 2 } }, efectos: [],
        diario: 'Tapé los canteros con tablas y paja antes de la helada. Mañana veremos.',
        luego: [{ dias: 1, id: 's-helada-salvada' }] },
      { id: 'dejar', texto: 'Dejarlos: lo que es de la tierra, que aguante', detalle: 'La huerta se hiela', efectos: [{ tipo: 'helada' }],
        diario: 'Iba a helar y dejé la huerta como estaba.' },
    ],
  },
];
export const EVENTO_VALLE = Object.fromEntries(EVENTOS_VALLE.map((e) => [e.id, e]));

// "Lo que pasó después": llegan días más tarde, en una tarjeta con un solo botón.
// `evento`: encadena otro evento del valle (una decisión trae la siguiente).
export const SEGUIMIENTOS = {
  's-tobillo-cana': { titulo: 'Nicanor ya camina', hora: 15, texto: 'Nicanor ya anda, con un bastón de colihue, y te dejó un paquete: «Para que no digas que no agradezco». Adentro hay moscas atadas a mano, de las suyas, de las que no le da a nadie. Y avisó que esta tarde pasa por tu mesa.',
    efectos: [{ tipo: 'cosa', id: 'mosca', sino: { cuenta: { yerba: 6 }, texto: 'Nicanor te dejó yerba' } }, { tipo: 'visita', quien: 'nicanor' }] },
  's-tobillo-truchas': { titulo: 'Truchas en la puerta', texto: 'A la mañana encontraste dos truchas envueltas en hojas de nalca en el escalón. No hace falta preguntar de quién son.',
    efectos: [{ tipo: 'dar', premio: { cuenta: { yerba: 4 }, ramitas: 4, texto: 'Nicanor te dejó yerba y un atado de ramitas' } }] },
  's-tobillo-ema': { titulo: 'Un esguince, nada más', texto: 'Ema pasó a contarte: era un esguince y Nicanor ya anda rengueando y protestando, que es buena señal. «Hiciste bien en venir a buscarme», dijo.',
    efectos: [] },
  's-puente-ramon': { titulo: 'Ramón cruzó el puente', texto: 'Ramón cruzó el puente con toda la majada y ni una tabla se movió. A la tarde te subió piedra de su pedrero y troncos secos: «El que arregla lo de todos no tiene que juntar solo».',
    efectos: [{ tipo: 'dar', premio: { materiales: { piedra: 8, tronco: 4 }, texto: 'Ocho piedras y cuatro troncos de Ramón' } }] },
  's-puente-vialidad': { titulo: 'Vino Vialidad', texto: 'La cuadrilla de Vialidad Provincial vino en una camioneta que hacía más ruido que el tren y dejó el puente como nuevo. Ercilia dice que sin tu aviso tardaban un mes.',
    efectos: [{ tipo: 'dar', premio: { cuenta: { yerba: 3 }, texto: 'Ercilia te regaló yerba por el aviso' } }] },
  's-puente-caida': { titulo: 'El puente cedió', texto: 'Ercilia te lo contó en el almacén: el puente del arroyo terminó de ceder y Nicanor, que venía cargado con la caña y el canasto, fue a parar al agua.',
    efectos: [], evento: 'tobillo' },
  's-temporal-atado': { titulo: 'Pasó el temporal', texto: 'Sopló toda la noche. A la mañana lo tuyo estaba en su lugar, atado y firme, y el suelo cubierto de ramas caídas, de las buenas para prender.',
    efectos: [{ tipo: 'dar', premio: { ramitas: 8, texto: 'Ocho ramitas que tiró el viento' } }] },
  's-temporal-volteo': { titulo: 'Pasó el temporal', texto: 'La leña quedó seca, pero afuera el viento hizo lo suyo: algo de lo tuyo amaneció dado vuelta en el pasto.',
    efectos: [{ tipo: 'voltear' }] },
  's-temporal-todo': { titulo: 'Pasó el temporal', texto: 'Tendría que haberle hecho caso a Ramón. La leña amaneció empapada y el viento volteó algo de lo tuyo.',
    efectos: [{ tipo: 'voltear' }] },
  's-viajero-botas': { titulo: 'Un paquete del viajero', texto: 'Con el tren llegó un paquete para vos, atado con hilo sisal. Adentro, unas botas de goma casi nuevas y una tarjeta: «Para el que me sacó del bosque. Llegué al glaciar».',
    efectos: [{ tipo: 'cosa', id: 'botas', sino: { cuenta: { yerba: 8 }, texto: 'El viajero te mandó un kilo de yerba' } }] },
  's-viajero-semillas': { titulo: 'El viajero se fue temprano', texto: 'Cuando te despertaste, el viajero ya no estaba. Dejó el fuego cubierto de ceniza, como se debe, y un saquito de papas andinas para semilla: «Gracias por el fuego. Estas se dan en tierra fría». Ercilia dice que en la estación contó a todo el mundo que en el valle hay lugar y buena gente.',
    efectos: [{ tipo: 'dar', premio: { cuenta: { 'semillas-papa': 4 }, texto: 'Papas andinas para semilla' } }, { tipo: 'poblador' }] },
  's-viajero-ema': { titulo: 'El viajero apareció', texto: 'Ema encontró al viajero dando vueltas cerca del mallín, con el mapa al revés. Lo llevó hasta la estación. «Hay mapas que no sirven para nada», dijo.',
    efectos: [] },
  's-incendio-ema': { titulo: 'Ema trae plantines', texto: 'Ema pasó con una bolsa: «Por lo del fuego. Si no llegabas, se quemaba media ladera». Son semillas del vivero del parque, para que plantes donde el bosque se abrió.',
    efectos: [{ tipo: 'dar', premio: { cuenta: { 'semillas-habas': 3 }, ramitas: 6, texto: 'Semillas del vivero del parque y un atado de ramitas' } }] },
  's-incendio-quemado': { titulo: 'Lo que dejó el fuego', texto: 'Pasaste por el claro que se quemó: ceniza, troncos negros y un olor que no se va. Ema dice que en dos años va a estar verde. Que la próxima, si se puede, hay que llegar antes.',
    efectos: [] },
  's-oveja-lana': { titulo: 'Lana de Ramón', texto: 'Ramón te dejó en la puerta dos vellones bien lavados, de la oveja porfiada. «Esa es la que da la mejor lana», dijo. «Por algo es así.»',
    efectos: [{ tipo: 'dar', premio: { materiales: { lana: 2 }, texto: 'Dos vellones de lana' } }] },
  's-oveja-perro': { titulo: 'La oveja volvió sola', texto: 'La oveja volvió sola al puesto, a la noche, con el perro atrás dándole charla. Ramón no sabe si agradecerte o reírse.',
    efectos: [{ tipo: 'gratitud', quien: 'ramon', n: 1 }] },
  's-musicos-fiesta': { titulo: 'Después de la guitarreada', texto: 'Los músicos se fueron temprano, con el acordeón al hombro. Los vecinos todavía hablan de la noche. Ercilia te dejó un paquete con lo que sobró de la fiesta.',
    efectos: [{ tipo: 'dar', premio: { cuenta: { yerba: 6 }, materiales: { tabla: 2 }, texto: 'Yerba de la fiesta y dos tablas del tablado' } }] },
  's-musicos-carta': { titulo: 'Una postal', texto: 'Llegó una postal de El Bolsón, de los músicos: «Tocamos la zamba del valle en la plaza. Le pusimos tu nombre, que no sabemos». Ercilia la clavó en la pared del almacén.',
    efectos: [] },
  's-huemul-ema': { titulo: 'El huemul está bien', texto: 'Ema lo vio pastando en el mallín, rengueando apenas. «Lo marcamos para el censo», dijo. «Y los del parque sacaron ese alambrado. Te dejo esto, que en el parque sobra.»',
    efectos: [{ tipo: 'cosa', id: 'farol', sino: { cuenta: { yerba: 6 }, texto: 'Ema te dejó yerba' } }] },
  's-huemul-alambre': { titulo: 'Sacaron el alambrado', texto: 'Los guardaparques sacaron el alambrado viejo entero. Ema te contó que el huemul volvió al bosque sin problema.',
    efectos: [] },
  's-derrumbe-ramal': { titulo: 'Carta del ramal', texto: 'La administración del ramal te mandó unas líneas de agradecimiento con el tren, y unos durmientes viejos que ya no sirven para la vía pero sí para una casa.',
    efectos: [{ tipo: 'dar', premio: { materiales: { tabla: 6 }, texto: 'Seis tablas de durmiente' } }] },
  's-almacen-harina': { titulo: 'Ercilia volvió del pueblo', hora: 15, texto: 'Ercilia volvió en el tren con bolsas y novedades. Revisó el cuaderno de fiado, asintió, y te mandó harina y yerba: «Esto no es pago. Es de vecina». Dice que a la tarde pasa por tu casa a contarte lo del pueblo.',
    efectos: [{ tipo: 'dar', premio: { cuenta: { harina: 4, yerba: 4 }, texto: 'Harina y yerba de Ercilia' } }, { tipo: 'visita', quien: 'ercilia' }] },
  's-helada-salvada': { titulo: 'Amaneció blanco', texto: 'Heló fuerte: el pasto crujía y el balde era un bloque. Pero debajo de las tablas los canteros estaban verdes y enteros.',
    efectos: [] },
  // la gratitud acumulada: cada vecino, una vez, te deja algo especial
  'regalo-ramon': { titulo: 'Un regalo de Don Ramón', texto: 'Ramón subió con la majada y te dejó un poncho que tejió su mujer, hace años. «En casa ya no lo usa nadie», dijo, mirando para otro lado. «Y vos sos de acá.»',
    efectos: [{ tipo: 'dar', premio: { cuenta: { poncho: 1 }, texto: 'Un poncho de lana de la majada' } }] },
  'regalo-nicanor': { titulo: 'Un regalo de Nicanor', texto: 'Nicanor te llevó al muelle y te mostró su pozón secreto, donde duermen las marrones grandes. «No se lo digas a nadie», te dijo, y te regaló tablas de ciprés para un bote.',
    efectos: [{ tipo: 'dar', premio: { materiales: { tabla: 10 }, texto: 'Diez tablas de ciprés' } }] },
  'regalo-ema': { titulo: 'Un regalo de Ema', texto: 'Ema te regaló su manta del parque, la de las noches de censo. «A mí me dieron una nueva», dijo. «Esta ya sabe dormir en el bosque.»',
    efectos: [{ tipo: 'cosa', id: 'manta', sino: { cuenta: { yerba: 8 }, texto: 'Ema te dejó un kilo de yerba' } }] },
  'regalo-ercilia': { titulo: 'Un regalo de Ercilia', texto: 'Ercilia te dio una bolsa de harina de la buena y un frasco de yerba de la que guarda para ella. «Vecinos como vos no se consiguen en el tren», dijo.',
    efectos: [{ tipo: 'dar', premio: { cuenta: { harina: 6, yerba: 8 }, texto: 'Harina y yerba de las buenas' } }] },
  'regalo-guarda': { titulo: 'Un regalo de Elsa', texto: 'Elsa te regaló un boleto de cartón, de los viejos, perforado a mano: «Válido para siempre». Y unos troncos de la leñera de la estación.',
    efectos: [{ tipo: 'dar', premio: { materiales: { tronco: 6 }, texto: 'Seis troncos de la estación' } }] },
};

// ---------------------------------------------------------------- lo guardado
const ent = (v, max = 1e7) => Math.max(0, Math.min(max, Math.floor(Number(v) || 0)));
const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
export function eventosValleNuevos(azar = Math.random) {
  return { semilla: 1 + Math.floor(azar() * 2 ** 30), ultimo: 0, revisado: 0, hechos: {}, veces: {}, pendientes: [], gratitud: {}, regalos: {}, activo: null };
}
export function sanearEventosValle(v, azar = Math.random) {
  const base = eventosValleNuevos(azar);
  if (!v || typeof v !== 'object' || Array.isArray(v)) return base;
  const s = ent(v.semilla, 2 ** 31);
  if (s > 0) base.semilla = s;
  base.ultimo = ent(v.ultimo);
  base.revisado = ent(v.revisado);
  for (const [id, h] of Object.entries(obj(v.hechos))) {
    if (!Object.hasOwn(EVENTO_VALLE, id) || !h || typeof h !== 'object') continue;
    const op = EVENTO_VALLE[id].opciones.some((o) => o.id === h.opcion) ? h.opcion : null;
    base.hechos[id] = { dia: ent(h.dia), opcion: op };
  }
  for (const [id, n] of Object.entries(obj(v.veces))) if (Object.hasOwn(EVENTO_VALLE, id)) base.veces[id] = Math.min(99, ent(n));
  for (const p of Array.isArray(v.pendientes) ? v.pendientes : []) {
    if (!p || typeof p !== 'object' || !Object.hasOwn(SEGUIMIENTOS, p.id)) continue;
    if (base.pendientes.some((x) => x.id === p.id)) continue;
    base.pendientes.push({ id: p.id, dia: ent(p.dia) });
    if (base.pendientes.length >= 12) break;
  }
  for (const [k, n] of Object.entries(obj(v.gratitud))) if (Object.hasOwn(QUIEN, k)) base.gratitud[k] = Math.min(99, ent(n));
  for (const k of Object.keys(obj(v.regalos))) if (Object.hasOwn(QUIEN, k)) base.regalos[k] = true;
  const a = v.activo;
  if (a && typeof a === 'object' && Object.hasOwn(EVENTO_VALLE, a.id)) base.activo = { id: a.id, desde: ['azar', 'historia', 'cadena'].includes(a.desde) ? a.desde : 'azar', dia: ent(a.dia) };
  return base;
}

// ---------------------------------------------------------------- el azar sembrado
function hashTexto(t) {
  let h = 2166136261;
  for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function generador(semilla) {
  let a = semilla >>> 0 || 1;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
// El día `dia`, ¿puede haber evento, y a qué hora? Sale siempre igual para la misma semilla.
export function tiradaDelDia(ev, dia) {
  const r = generador(hashTexto(`valle|${ev.semilla}|${dia}`));
  return { sale: r() < EVENTOS.chance, hora: EVENTOS.desde + r() * EVENTOS.ventana, azar: r() };
}

// Los que pueden pasar ahora. `s`: { dia, horas, vecinos, viaje, sembrados, lluvia, pronostico: { temporal, helada } }.
export function posibles(ev, s) {
  return EVENTOS_VALLE.filter((e) => {
    if (e.vecinos && s.vecinos === false) return false;
    const h = ev.hechos[e.id];
    if (h && !(e.repite && s.dia - h.dia >= e.repite)) return false;
    return !!e.cuando(s);
  });
}

// Una vez por cuadro (con calma): ¿aparece un evento? Si sí, queda `activo` (hasta que se
// elija una opción) y se devuelve. Un día se decide una sola vez: si ese día no sale, o no
// hay ninguno posible, se espera al próximo.
export function revisarEventos(ev, s) {
  if (ev.activo) return EVENTO_VALLE[ev.activo.id];
  if (s.dia < EVENTOS.diaMinimo || ev.revisado >= s.dia) return null;
  if (ev.ultimo && s.dia - ev.ultimo < EVENTOS.cada) return null;
  const t = tiradaDelDia(ev, s.dia);
  if (!t.sale) { ev.revisado = s.dia; return null; }
  if (s.horas < t.hora) return null;
  ev.revisado = s.dia;
  const lista = posibles(ev, s);
  if (!lista.length) return null;
  const e = lista[Math.floor(t.azar * lista.length) % lista.length];
  ev.activo = { id: e.id, desde: 'azar', dia: s.dia };
  return e;
}
// La historia (o una consecuencia) pide un evento puntual, sin mirar si "le toca".
export function forzarEvento(ev, id, dia, desde = 'historia') {
  if (!Object.hasOwn(EVENTO_VALLE, id)) return null;
  if (ev.activo) return ev.activo.id === id ? EVENTO_VALLE[id] : null;
  ev.activo = { id, desde, dia: ent(dia) };
  return EVENTO_VALLE[id];
}

// ¿Alcanza lo que tenés para esta opción? `tengo`: { materiales, cosas, ramitas }.
export function faltaPara(pide, tengo = {}) {
  const falta = [];
  for (const [k, n] of Object.entries(pide?.materiales || {})) if ((Number(tengo.materiales?.[k]) || 0) < n) falta.push(`${n} ${nombreCosa(k, n)}`);
  for (const [k, n] of Object.entries(pide?.cuenta || {})) if ((Number(tengo.cosas?.[k]) || 0) < n) falta.push(`${n} ${nombreCosa(k, n)}`);
  if (pide?.ramitas && (Number(tengo.ramitas) || 0) < pide.ramitas) falta.push(`${pide.ramitas} ramitas`);
  return falta;
}
const NOMBRES_COSA = { tabla: ['tabla', 'tablas'], tronco: ['tronco', 'troncos'], piedra: ['piedra', 'piedras'], lana: ['vellón', 'vellones'], yerba: ['de yerba', 'de yerba'], harina: ['medida de harina', 'medidas de harina'] };
export function nombreCosa(k, n) {
  const x = Object.hasOwn(NOMBRES_COSA, k) ? NOMBRES_COSA[k] : [k, k];
  return n === 1 ? x[0] : x[1];
}

// Elegiste. Devuelve lo que hay que hacer (el juego cobra lo que pide y aplica los
// efectos) y agenda lo que viene después. `tengo` para no cobrar lo que no hay.
export function elegirOpcion(ev, opcionId, dia, tengo = null) {
  const a = ev.activo;
  if (!a) return null;
  const e = EVENTO_VALLE[a.id];
  const o = e?.opciones.find((x) => x.id === opcionId);
  if (!o) return null;
  if (tengo && faltaPara(o.pide, tengo).length) return { ok: false, falta: faltaPara(o.pide, tengo) };
  const d = Math.max(1, ent(dia));
  ev.hechos[e.id] = { dia: d, opcion: o.id };
  ev.veces[e.id] = (ev.veces[e.id] || 0) + 1;
  ev.ultimo = d;
  ev.activo = null;
  for (const l of o.luego || []) agendar(ev, l.id, d + Math.max(0, ent(l.dias)));
  return { ok: true, evento: e, opcion: o, efectos: o.efectos || [], pide: o.pide || null, diario: o.diario || '' };
}
export function agendar(ev, id, dia) {
  if (!Object.hasOwn(SEGUIMIENTOS, id) || ev.pendientes.some((p) => p.id === id)) return false;
  ev.pendientes.push({ id, dia: ent(dia) });
  if (ev.pendientes.length > 12) ev.pendientes.shift();
  return true;
}
// El primer "después" que ya llegó.
export function seguimientoListo(ev, s) {
  return ev.pendientes.find((p) => s.dia > p.dia || (s.dia === p.dia && s.horas >= (SEGUIMIENTOS[p.id]?.hora || EVENTOS.seguimientoDesde))) || null;
}
// Se mostró: sale de la lista y devuelve sus efectos (y el evento que encadena, si hay).
// 3.5.1: `opciones.vecinos === false`: una partida sin vecinos no recibe el evento encadenado de un
// vecino (el puente que cedió traía a Nicanor igual)
export function cerrarSeguimiento(ev, id, dia, opciones = {}) {
  const i = ev.pendientes.findIndex((p) => p.id === id);
  if (i < 0) return null;
  ev.pendientes.splice(i, 1);
  // una cosa por día: el día que llega "lo de después", no sale además uno nuevo al azar
  ev.revisado = Math.max(ev.revisado || 0, ent(dia));
  const seg = SEGUIMIENTOS[id];
  let cadena = null;
  const sinVecino = opciones.vecinos === false && EVENTO_VALLE[seg.evento]?.vecinos;
  if (seg.evento && !ev.activo && !sinVecino) cadena = forzarEvento(ev, seg.evento, dia, 'cadena');
  return { seguimiento: seg, efectos: seg.efectos || [], cadena };
}

// La gratitud de un vecino. Al llegar a `EVENTOS.regalo` por primera vez, te deja algo.
export function sumarGratitud(ev, quien, n, dia) {
  if (!Object.hasOwn(QUIEN, quien)) return false;
  ev.gratitud[quien] = Math.min(99, (ev.gratitud[quien] || 0) + ent(n, 99));
  if (ev.gratitud[quien] >= EVENTOS.regalo && !ev.regalos[quien]) {
    ev.regalos[quien] = true;
    agendar(ev, `regalo-${quien}`, ent(dia) + 1);
    return true;
  }
  return false;
}

// Una línea para la guía: qué pasó y qué quedó pendiente.
export function resumenEventos(ev) {
  const hechos = Object.keys(ev?.hechos || {}).length;
  const agradecidos = Object.entries(ev?.gratitud || {}).filter(([, n]) => n > 0).map(([k]) => nombreVecinoEvento(k));
  return `${hechos} ${hechos === 1 ? 'cosa pasó' : 'cosas pasaron'} en el valle de ${EVENTOS_VALLE.length} que pueden pasar`
    + (agradecidos.length ? ` · te están agradecidos: ${agradecidos.join(', ')}` : '')
    + ((ev?.pendientes || []).length ? ' · algo quedó por verse' : '');
}
