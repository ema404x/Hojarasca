// 4.15.0 (B): los textos del ACTO I de la Historia («El trato del molino», capítulos 1 a 4) como DATOS: tarjeta de entrada, objetivos,
// premio, tarjeta de cierre (con variantes según las decisiones), notas y objetos que se leen, las entradas del cuaderno de lo raro (con su
// id, el mismo de los efectos `raro:<id>` de las escenas) y las líneas de charla «tema de historia» de los vecinos. Módulo puro.
// Lo escribe el agente B; lo enchufa el agente A (historia.js / historia-ui.js). Sin inglés: se traduce todo al final.
//
// Formas:
//   capitulos[n] = { n, id, titulo, acto, estacion, dia, minutos, entrada: [párrafos], objetivos: [{ id, texto, tecla }], optativas: [{ id, texto }],
//                    premio: { texto, ... }, cierre: { base: [párrafos], segun?: { d, a, b, c }, alterno?: { ... } } }
//   notas[id]    = { titulo, texto: [párrafos] }                      (lo que se lee en pantalla: cartas, notas, placas)
//   objetos[id]  = { nombre, texto }                                  (la descripción de un objeto de historia)
//   raro[id]     = { titulo, texto, cap, donde }                      (el cuaderno de lo raro)
//   charla[quien] = [{ id, cap, texto, cuando? }]                     (la línea de «tema de historia» de la E; `cuando`: { decision, es } | { optativa } )

export const TEXTO_ACTO1 = {
  capitulos: {
    1: {
      n: 1, id: 'llegada', titulo: 'La llave del molinero', acto: 1, estacion: 'verano', dia: 1, minutos: '20 / 25',
      entrada: [
        'El aviso salió en el diario de Esquel, en un rincón, entre una cosechadora usada y un perro perdido: «Se cede refugio en el valle a quien lo habite y lo cuide. Preguntar por Ercilia.»',
        'Contestaste sin pensarlo mucho. Una semana después te llegó una llave pesada, atada con un piolín, y un pasaje de trochita. Ahora vas sentado contra la ventanilla, con el valle entrando de a poco por el vidrio.',
      ],
      objetivos: [
        { id: 'refugio', texto: 'Llegá al Refugio del Arroyo', tecla: '·' },
        { id: 'llave', texto: 'Abrí la puerta con la llave de Eusebio (E en la puerta)', tecla: 'E' },
        { id: 'fuego', texto: 'Prendé un fuego antes de que oscurezca: tres ramitas del suelo y F en un claro', tecla: 'F' },
        { id: 'anotar', texto: 'Anotá dos cosas del bosque en el cuaderno', tecla: 'E' },
        { id: 'noche', texto: 'Pasá tu primera noche en el valle (E junto al fuego o bajo techo)', tecla: 'E' },
        { id: 'umbral', texto: 'Mirá lo que hay en el umbral', tecla: 'E' },
      ],
      optativas: [{ id: 'frasco-masa-madre', texto: 'El frasco de la repisa: llevale la masa madre de Eusebio a Rosa, la panadera' }],
      premio: { texto: 'Seis ramitas, dos troncos y el canto blanco, que queda en la repisa como adorno', ramitas: 6, materiales: { tronco: 2 }, objetos: ['canto-blanco'], desbloqueo: 'cuaderno-de-lo-raro' },
      cierre: {
        base: [
          'Amaneció. Del lago sube una neblina finita y en el techo canta un chucao.',
          'Alguien estuvo en tu puerta y no se llevó nada. Al contrario.',
          'El refugio tiene goteras, la puerta cierra mal y la leña de adentro es de otro siglo. Hay trabajo.',
        ],
      },
    },
    2: {
      n: 2, id: 'bolsa', titulo: 'La bolsa del molinero', acto: 1, estacion: 'verano', dia: 2, minutos: '30 / 40',
      entrada: [
        'Don Ramón pasó temprano con la majada y se quedó mirando el techo como quien mira un caballo cansado.',
        '«Eso no aguanta el invierno», dijo, sin maldad. «Pero se arregla. Madera hay; lo que falta es hacha y banco.»',
      ],
      objetivos: [
        { id: 'ramon', texto: 'Hablá con Don Ramón', tecla: 'E' },
        { id: 'viaje', texto: 'Tomá la trochita a la Aldea de los Duendes', tecla: 'E' },
        { id: 'hacha', texto: 'Conseguí el hacha en el almacén de Ercilia', tecla: 'E' },
        { id: 'talar', texto: 'Talá un árbol seco: tres hachazos (al pehuén no se lo toca)', tecla: 'H' },
        { id: 'banco', texto: 'Levantá un banco de carpintero (O → Trabajo)', tecla: 'O' },
        { id: 'alero', texto: 'Arreglá el alero del refugio: cuatro tablas', tecla: 'E' },
        { id: 'bolsa', texto: 'Decidí qué hacer con la bolsa del molinero y cumplilo', tecla: 'E' },
      ],
      optativas: [
        { id: 'frasco-masa-madre', texto: 'El frasco de la repisa: llevarle la masa madre de Eusebio a Rosa' },
        { id: 'oveja', texto: 'La oveja de Ramón: dale una mano si se descarría una' },
        { id: 'banco-primero', texto: 'El banco primero: el encargo de Ramón' },
      ],
      premio: { texto: 'Seis tablas y cuatro piedras del galpón de Ramón', materiales: { tabla: 6, piedra: 4 }, extra: { cuando: { decision: 'bolsa', es: 'b' }, texto: 'y unos panes de Rosa' } },
      cierre: {
        base: [
          'El alero ya no gotea. Ramón lo empujó con el palo para ver si bailaba y no bailó. «Ahora sí», dijo.',
        ],
        segun: {
          d: 'bolsa',
          a: 'Esa noche, del lado del arroyo, alguien se rió bajito. Una risa contenta, si es que las risas se entienden.',
          b: 'En la aldea, a la tarde, olía a pan en todas las cuadras. Y a la noche, en tu gallinero, alguien abrió la puertita.',
          c: 'Josefina pasó dos veces por tu camino esa tarde, como si fuera casualidad. Las dos veces miró el refugio.',
        },
        // si en la partida no hay gallinero, la variante B usa esta
        alterno: { b: 'En la aldea, a la tarde, olía a pan en todas las cuadras. Y a la noche, alguien dejó abierta la tranquera de tu refugio, de par en par.' },
      },
    },
    3: {
      n: 3, id: 'mesa', titulo: 'La mesa larga', acto: 1, estacion: 'verano', dia: 3, minutos: '25 / 35',
      entrada: [
        'En el valle hay poca gente y todos se conocen. Se conocen tanto que se saludan de lejos para no tener que hablar.',
        '«Una casa sin mesa es un galpón», te dijo Ercilia. «Poné una mesa con dos sillas y vas a ver cómo la gente se arrima.»',
      ],
      objetivos: [
        { id: 'vecinos', texto: 'Conocé a los vecinos: Ramón, Nicanor, Josefina, Ercilia y Fermín (en el galpón de esquila)', tecla: 'E' },
        { id: 'placa', texto: 'Leé la placa del duende en la plaza de la aldea y hablá con Herminia', tecla: 'E' },
        { id: 'mesa', texto: 'Armá una mesa de campo con dos sillas', tecla: 'O' },
        { id: 'visita', texto: 'Recibí una visita en tu mesa', tecla: '·' },
        { id: 'tobillo', texto: 'Algo pasó en la orilla: ayudá a Nicanor', tecla: 'E' },
      ],
      optativas: [
        { id: 'encargo', texto: 'Aceptá un encargo de algún vecino' },
        { id: 'fermin-pan', texto: 'Pedido de Fermín: llevale harina o pan al galpón de esquila' },
      ],
      premio: { texto: 'Medio kilo de yerba de los vecinos', cuenta: { yerba: 4 }, desbloqueo: 'tablon-encargos-historia' },
      cierre: {
        base: [
          'Esa tarde, en la mesa nueva, hubo mate. Nadie habló de risas ni de puertitas: se habló del tiempo, de las truchas y de lo cara que está la yerba. Pero a la hora de irse, todos miraron un segundo para el lado del arroyo.',
          'Nadie lo dijo, pero algo quedó decidido: ya sos del valle. Acá eso no se anuncia: se nota en que te guardan la yerba.',
        ],
      },
    },
    4: {
      n: 4, id: 'ramal', titulo: 'La señora del ramal', acto: 1, estacion: 'verano', dia: 4, minutos: '30 / 40',
      entrada: [
        'Elsa te esperó en el andén con los botones de bronce lustrados como para un casamiento.',
        '«Viene una ingeniera de la Administración», dijo. «A contar. Cuando vienen a contar, pasajero, es porque ya contaron.»',
      ],
      objetivos: [
        { id: 'anden', texto: 'Recibí a la ingeniera en la Estación del Valle (llegá antes de las 11)', tecla: '·' },
        { id: 'viajar', texto: 'Viajá con Graciela hasta la Aldea de los Duendes', tecla: 'E' },
        { id: 'cabina', texto: 'Subí a la cabina y manejá un tramo: W regulador, S freno', tecla: 'E' },
        { id: 'fletes', texto: 'Entregá dos fletes manejando, antes del fin del verano', tecla: 'E' },
        { id: 'piedras', texto: 'Piedras en la vía: ayudá a despejarla', tecla: 'E' },
        { id: 'puertita', texto: 'Guardá la puertita en tu repisa', tecla: 'E' },
      ],
      optativas: [
        { id: 'vuelta-ingeniera', texto: 'Una vuelta para la ingeniera: llevala a dos lugares lindos (el mirador del pehuén, el faro o la casa de té)' },
        { id: 'vuelta-completa', texto: 'La vuelta completa: el encargo de Elsa' },
      ],
      premio: { texto: 'Yerba y cuatro tablas de durmiente; y el pase de cabina: desde ahora manejás la trochita sin pedir permiso', cuenta: { yerba: 8 }, materiales: { tabla: 4 }, desbloqueo: 'pase-cabina' },
      cierre: {
        base: [
          'Graciela se quedó a dormir en la aldea. Dice que vuelve en cada estación «a contar».',
          'Elsa la vio irse por la calle de la vía y se quedó mirando la puertita que te dio.',
          '«El tren se maneja con las orejas», repitió, bajito. «Y el valle también, pasajero. Escuche.»',
        ],
      },
    },
  },

  // lo que se lee: notas, cartas, placas
  notas: {
    'aviso-diario': { titulo: 'El aviso del diario', texto: ['«Se cede refugio en el valle a quien lo habite y lo cuide. Preguntar por Ercilia, almacén de la Aldea de los Duendes.»'] },
    'nota-eusebio': { titulo: 'Nota de Eusebio', texto: ['Al que venga: la leña de adentro está húmeda y la de afuera no existe.', 'La estufa tira si le hablás bajito. No toques el frasco de la repisa, que es masa madre de 1987. Y gracias. E. M.'] },
    'nota-bolsa': { titulo: 'La nota de la bolsa', texto: ['Para la raíz del coihue grande del molino viejo, antes del primer frío.', 'No te olvides, que ellos no se olvidan. Y gracias. E. M.'] },
  },

  // la descripción de los objetos de historia (cuando los mirás en la mochila o en la repisa)
  objetos: {
    'foto-eusebio': { nombre: 'La foto de Eusebio', texto: 'Un hombre flaco con una bolsa de harina al hombro y cara de no querer salir en la foto. Detrás, un molino que ya no gira.' },
    'nota-eusebio': { nombre: 'La nota de Eusebio', texto: 'Tiene la letra inclinada y termina, como todo lo suyo, con «y gracias».' },
    'bolsa-eusebio': { nombre: 'La bolsa de Eusebio', texto: 'Diez kilos de harina buena, en arpillera, atados con un piolín colorado. Tiene un destino y una fecha: antes del primer frío.' },
    'canto-blanco': { nombre: 'El canto blanco', texto: 'Un canto rodado blanco, liso como un huevo. Está tibio. Nadie sabe de qué arroyo viene.' },
    'puertita': { nombre: 'La puertita', texto: 'Una puertita de madera de coihue, del tamaño de una mano, con bisagra de cuero y una manijita de hueso. Golpeá antes de abrir.' },
  },

  // el cuaderno de lo raro: indicios con fecha y lugar. Los ids son los de los efectos `raro:<id>` de las escenas.
  raro: {
    'algo-cruzo': { titulo: 'Algo cruzó el sendero', texto: 'Algo cruzó el sendero. Un zorro, seguro. Un zorro con gorro.', cap: 1, donde: 'sendero al refugio' },
    'ronda-ramitas': { titulo: 'La ronda de ramitas', texto: 'Las ramitas que sobraron aparecieron en ronda frente a la puerta, como las horas de un relojito.', cap: 1, donde: 'umbral del refugio' },
    'canto-blanco': { titulo: 'Un canto blanco', texto: 'En el medio de la ronda, un canto rodado blanco, liso como un huevo. Tibio. Sin dueño.', cap: 1, donde: 'umbral del refugio' },
    'risa-lejos': { titulo: 'Una risa de noche', texto: 'Una risa corta, lejos, del lado del arroyo. Ercilia dice que son chimangos.', cap: 2, donde: 'arroyo' },
    'bolsa-raiz': { titulo: 'La bolsa en la raíz', texto: 'Dejé la bolsa en la raíz del coihue grande. Cuando me di vuelta, ya no estaba. O fue la luz.', cap: 2, donde: 'coihue grande' },
    'letra-eusebio': { titulo: 'La letra de Eusebio', texto: 'Josefina conoce la letra de Eusebio: su abuelo le llevaba el trigo. No quiso decir más. Algún día.', cap: 2, donde: 'aldea' },
    'hacha-tocon': { titulo: 'El hacha en el tocón', texto: 'El hacha caminó sola hasta el tocón. Los zorros no hacen eso.', cap: 3, donde: 'refugio' },
    'puertitas-peones': { titulo: 'Puertitas en las raíces', texto: 'Cuando tendieron la vía, los peones encontraron puertitas talladas en las raíces de los coihues. «Golpeá antes de abrir».', cap: 3, donde: 'plaza de la aldea' },
    'luces-lago': { titulo: 'Luces sobre el lago', texto: 'Nicanor ve luces chiquitas sobre el lago, de noche, que van y vienen. Como gente con farolitos. Muy petisa la gente.', cap: 3, donde: 'lago' },
    'vecinos-de-abajo': { titulo: 'Los vecinos de abajo', texto: 'Eusebio hablaba de «los vecinos de abajo». Ramón dice que eran los zorros. Se le nota que no lo cree del todo.', cap: 3, donde: 'refugio' },
    'puertita-via': { titulo: 'Una puertita en la vía', texto: 'Entre las piedras de la vía, una puertita de coihue del tamaño de una mano. Elsa me la dio a mí.', cap: 4, donde: 'vía de la trochita' },
    'puertita-noche': { titulo: 'Una puertita en mi puerta', texto: 'A la noche, apoyada contra mi puerta, una puertita de coihue del tamaño de una mano. No había nadie en el camino.', cap: 4, donde: 'refugio' },
  },

  // la línea de «tema de historia» de cada vecino: va arriba de todo en la charla, con su estrellita. Se muestra la última del capítulo en que estás
  // (o de uno anterior) cuyo `cuando` se cumpla. `cuando`: { decision, es } o { optativa } o { escena }.
  charla: {
    ramon: [
      { id: 'ramon-c2-techo', cap: 2, texto: 'Mirá el techo antes de que llueva. Si lo ves llorar, ya sabés: cuatro tablas del alero y listo.' },
      { id: 'ramon-c2-hacha', cap: 2, texto: 'Sin hacha no hacés nada. Y con hacha mal usada, peor. Mejor el árbol seco que el que da sombra.' },
      { id: 'ramon-c2-coihue', cap: 2, texto: "Fuiste hasta el coihue, ¿no? No me digas nada. Eusebio hacía lo mismo y tampoco me decía.", cuando: { decision: 'bolsa', es: 'a' } },
      { id: 'ramon-c3-mesa', cap: 3, texto: 'Tenés mesa. Falta que alguien se siente. Ya vendrá: el valle es chico y la curiosidad, grande.' },
      { id: 'ramon-c4-ingeniera', cap: 4, texto: 'Viene una ingeniera, dicen. Cuando vienen a contar, ya contaron. Eso lo sabe hasta el zaino.' },
    ],
    nicanor: [
      { id: 'nicanor-c1-lago', cap: 1, texto: 'Hay noches que el lago hace ruidos que no son de pez. Yo no digo nada. Pero escucho.' },
      { id: 'nicanor-c3-luces', cap: 3, texto: 'Las luces, vos fijate: nunca tocan el agua. Los pescadores nos fijamos en esas cosas.' },
      { id: 'nicanor-c4-ramal', cap: 4, texto: 'El ramal es el que me lleva las truchas a Esquel. Si cierran, me quedo con el pescado y sin cliente.' },
    ],
    josefina: [
      { id: 'josefina-c2-arbol', cap: 2, texto: 'Un árbol vivo es un nido, una sombra y quince años de lluvia guardada. Hacha, para el seco.' },
      { id: 'josefina-c2-letra', cap: 2, texto: 'Esa letra… mejor que no te cuente nada todavía. No es que no confíe en vos: es que no sé cómo se cuenta.', cuando: { decision: 'bolsa', es: 'c' } },
      { id: 'josefina-c3-puertitas', cap: 3, texto: 'Las puertitas son una leyenda de la aldea. Como científica, digo «no hay pruebas». Como Josefina… no pises las raíces del coihue grande.' },
      { id: 'josefina-c4-ramal', cap: 4, texto: 'Los turistas con linterna buscando duendes me ponen nerviosa. Pero si cierran el ramal, no queda nadie que cuide este valle.' },
    ],
    ercilia: [
      { id: 'ercilia-c2-gente', cap: 2, texto: 'La aldea necesita gente, querido. Lo que sobra en el valle es paisaje.' },
      { id: 'ercilia-c2-pan', cap: 2, texto: 'Rosa me contó que hizo pan con la harina de Eusebio. Lloré. Un poquito. Que no se entere Nélida.', cuando: { decision: 'bolsa', es: 'b' } },
      { id: 'ercilia-c3-mesa', cap: 3, texto: 'Poné una mesa con dos sillas y vas a ver cómo la gente se arrima. Una casa sin mesa es un galpón.' },
      { id: 'ercilia-c4-ingeniera', cap: 4, texto: 'Una ingeniera del ramal… Que no se lleve la estación en el portafolios, por favor.' },
    ],
    fermin: [
      { id: 'fermin-c3-ovejas', cap: 3, texto: 'Ramón me regala las ovejas diciéndome que ya eran mías, y yo se las agradezco diciéndole que son de él. Así llevamos veinte años.' },
      { id: 'fermin-c3-pan', cap: 3, texto: 'El pan todavía estaba tibio. Hacía rato que no comía pan de verdad. Gracias, amigo.', cuando: { optativa: 'fermin-pan' } },
      { id: 'fermin-c4-portafolios', cap: 4, texto: 'Escuché que viene una señora con un portafolios. En la estepa los portafolios no duran: el viento se los lleva.' },
    ],
    herminia: [
      { id: 'herminia-c3-chicos', cap: 3, texto: 'Los chicos de la escuela buscan duendes con un frasco. Nunca encuentran. Pero siempre vuelven con las mejillas coloradas.', cuando: { escena: 'placa-herminia' } },
      { id: 'herminia-c4-ingeniera', cap: 4, texto: 'Una ingeniera, ¿no? Mi marido era del ferrocarril. Los ingenieros miden todo, menos lo que importa.' },
    ],
    rosa: [
      { id: 'rosa-c2-masa', cap: 2, texto: 'La masa madre es como un duende: no se la ve trabajar, pero cuando te das vuelta, creció.' },
      { id: 'rosa-c2-frasco', cap: 2, texto: 'Si es el frasco de Eusebio, ¡traelo! Masa de 1987. ¿Sabés cuánto pan hay ahí adentro?', cuando: { optativa: 'frasco-masa-madre' } },
      { id: 'rosa-c2-nuez', cap: 2, texto: 'Con la harina de Eusebio, el pan salió con gusto a nuez. No sé qué hacía ese hombre con el trigo.', cuando: { decision: 'bolsa', es: 'b' } },
      { id: 'rosa-c3-mesa', cap: 3, texto: 'Para tu mesa nueva, llevate un pan. Una mesa sin pan es una mesa de paso.' },
    ],
    elsa: [
      { id: 'elsa-c1-fuego', cap: 1, texto: '¿Prendió el fuego, pasajero? Mire que oscurece ligero y la leña no se hace sola.' },
      { id: 'elsa-c2-hacha', cap: 2, texto: '¿Fue al almacén? Ercilia le va a cobrar el hacha en cantos y ramitas. Mejor así: los cantos pesan, pero no se acaban.' },
      { id: 'elsa-c3-visita', cap: 3, texto: 'La semana que viene viene gente de la Administración. Me tiembla el rodete.' },
      { id: 'elsa-c4-ingeniera', cap: 4, texto: 'La ingeniera cuenta bolsas con la mirada. Hay que cargar más. Pasajero, ¿usted sabe manejar un tren?' },
      { id: 'elsa-c4-puertita', cap: 4, texto: 'Esa puertita no es de nadie. O es de todos. Guárdela donde la vea cada mañana.', cuando: { escena: 'derrumbe-puertita' } },
    ],
  },
};

// ---------------------------------------------------------------- consultas
// El cierre de un capítulo como lista de párrafos, con la variante de la decisión (`decisiones`: { bolsa: 'a' | 'b' | 'c' | null }).
// `sinGallinero`: usa la variante alterna de la B del capítulo 2.
export function cierreDe(n, decisiones = {}, { sinGallinero = false } = {}) {
  const c = Object.hasOwn(TEXTO_ACTO1.capitulos, n) ? TEXTO_ACTO1.capitulos[n] : null;
  if (!c) return [];
  const r = [...c.cierre.base];
  const s = c.cierre.segun;
  if (s) {
    const v = decisiones && Object.hasOwn(decisiones, s.d) ? decisiones[s.d] : null;
    if (v === 'a' || v === 'b' || v === 'c') r.push(sinGallinero && c.cierre.alterno && c.cierre.alterno[v] ? c.cierre.alterno[v] : s[v]);
  }
  return r;
}
// El premio como texto de la tarjeta, con lo extra que depende de la decisión
export function premioDe(n, decisiones = {}) {
  const c = Object.hasOwn(TEXTO_ACTO1.capitulos, n) ? TEXTO_ACTO1.capitulos[n] : null;
  if (!c) return '';
  const p = c.premio;
  const e = p.extra;
  const aplica = e && decisiones && decisiones[e.cuando.decision] === e.cuando.es;
  return aplica ? `${p.texto} ${e.texto}` : p.texto;
}
// La línea de «tema de historia» de un vecino en el capítulo `cap`: la última cuyo capítulo ya llegó y cuya condición se cumple.
// `estado`: { decisiones: {}, optativas: Set|array, escenas: Set|array }
export function charlaDe(quien, cap, estado = {}) {
  const lista = Object.hasOwn(TEXTO_ACTO1.charla, quien) ? TEXTO_ACTO1.charla[quien] : [];
  const tiene = (conj, id) => (conj instanceof Set ? conj.has(id) : Array.isArray(conj) && conj.includes(id));
  const ok = (l) => {
    if (l.cap > cap) return false;
    const w = l.cuando;
    if (!w) return true;
    if (w.decision) return !!estado.decisiones && estado.decisiones[w.decision] === w.es;
    if (w.optativa) return tiene(estado.optativas, w.optativa);
    if (w.escena) return tiene(estado.escenas, w.escena);
    return true;
  };
  const validas = lista.filter(ok);
  if (!validas.length) return null;
  // la más nueva (de capítulo más alto); entre las de ese capítulo, la que tiene condición gana a la general
  const tope = Math.max(...validas.map((l) => l.cap));
  const delTope = validas.filter((l) => l.cap === tope);
  return delTope.find((l) => l.cuando) || delTope[0];
}
