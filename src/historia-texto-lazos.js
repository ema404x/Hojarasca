// 4.18.2 (B): los textos de los LAZOS de los vecinos que no tenían (Rosa, Tito, Tobías, Herminia, Nicanor, Belisario y Sofía) de la Historia
// («El trato del molino») como DATOS. Módulo puro y sin imports (así A lo puede importar desde historia.js sin ciclos). Lo escribe el agente B;
// lo enchufa el agente A. Las claves son las del lazo (`lazo:<quien>:<n>`). Sin inglés: se traduce todo al final. Nunca hay números a la vista:
// lo que se muestra es la palabra del lazo (palabraLazo: frío, tirante, conocido, de confianza, de la casa).
//   · guia[quien]   = { nombre, rol, frases }       el nombre para la guía y la tarjeta de decisión, quién es, y una frase corta por palabra del lazo
//                                                   (`conocido`, `de confianza`, `de la casa`, y `tirante` sólo donde el guion lo justifica: Tito).
//   · final[quien]  = [{ id, min?, max?, solo?, texto }]   la línea de epílogo: la primera de la lista cuyo rango contiene al lazo (y, si trae `solo`, cuyo final es
//                                                   ese: 'trato' o 'pelea'; ver finalDeLazos). Con dos líneas de lazo para el mismo vecino va primero la de lazo más alto.
//   · charlas[quien]= [{ id, cap, texto, cuando }]  líneas de la «charla de historia»: `cuando` es { lazo: { min?, max? } } (la del lazo) o
//                                                   { escena } (la de después de la escena de Sofía). Valen aunque el capítulo ya haya pasado.
//   · tablon[id]    = { caps, quien, titulo, ofrecida, hecha }   como TEXTO_OPTATIVAS.tablon, para las optativas de Sofía y de Belisario.
//   · raro[id]      = { titulo, texto, cap, donde }              el cuaderno de lo raro (el id es el del efecto `raro:<id>` de la escena).
// Alcance con las escenas de hoy (lo comprueba la prueba): Rosa, Tito, Tobías, Herminia y Nicanor llegan a 3 (Nicanor con dos encargos). 4.19.0: Belisario y Sofía
// llegaban sólo a 2; con `ultimo-cruce` y `del-otro-lado` (acto III, +1 cada una) llegan a 3 como los demás: tienen una línea de 3 y, segunda, la de 2 de antes.

export const VECINOS_LAZO = ['rosa', 'tito', 'tobias', 'herminia', 'nicanor', 'belisario', 'sofia'];

export const TEXTO_LAZOS = {
  guia: {
    rosa: { nombre: 'Rosa', rol: 'la panadera', frases: {
      'conocido': 'Te saluda desde el mostrador, con las manos en la masa.',
      'de confianza': 'Te guarda pan cuando pasás temprano.',
      'de la casa': 'El primer pan de la mañana es tuyo.',
    } },
    tito: { nombre: 'Tito', rol: 'el carpintero', frases: {
      'conocido': 'Te saluda con el lápiz detrás de la oreja.',
      'de confianza': 'Te muestra las tablas antes de cortarlas.',
      'de la casa': 'Te guarda un lugar en la mesa larga.',
      'tirante': 'Te habla del clima y de nada más.',
    } },
    tobias: { nombre: 'Tobías', rol: 'el cantero', frases: {
      'conocido': 'Levanta la maceta y te saluda sin soltar la piedra.',
      'de confianza': 'Te cuenta lo que le dice la piedra.',
      'de la casa': 'Te deja un cajón para sentarte en la cantera.',
    } },
    herminia: { nombre: 'Herminia', rol: 'la abuela de la aldea', frases: {
      'conocido': 'Te hace una seña desde la ventana.',
      'de confianza': 'Te cuenta las cosas de antes, con pausas.',
      'de la casa': 'Tu lugar en su cocina siempre está puesto.',
    } },
    nicanor: { nombre: 'Nicanor', rol: 'el pescador', frases: {
      'conocido': 'Te saluda desde el muelle.',
      'de confianza': 'Te cuenta cómo está el lago sin que le preguntes.',
      'de la casa': 'Te guarda un lugar en el muelle, a su lado.',
    } },
    belisario: { nombre: 'Belisario', rol: 'el arriero', frases: {
      'conocido': 'Te saluda tocándose el sombrero.',
      'de confianza': 'Te convida un mate sin cobrarte.',
      'de la casa': 'Para las mulas ya sos de la familia.',
    } },
    sofia: { nombre: 'Sofía', rol: 'la fotógrafa', frases: {
      'conocido': 'Te mira como si ya te estuviera encuadrando.',
      'de confianza': 'Te saca fotos sin avisar y después te las muestra.',
      'de la casa': 'Te guarda un lugar en el estudio, entre sus fotos.',
    } },
  },

  // el epílogo: una línea corta por vecino con lazo alto; Tito suma una tirante (es el único que puede quedar así con las escenas: D2 = dejar el coihue en pie)
  final: {
    rosa: [
      { id: 'final-rosa', min: 3, texto: 'Rosa te guarda el primer pan de cada mañana, todavía caliente. Dice que es costumbre y no cariño. Lo dice con la boca llena.' },
    ],
    tito: [
      { id: 'final-tito', min: 3, texto: 'Tito te dejó en el refugio un estante de lenga, derecho como una regla, que nadie recuerda haber encargado. Dice que la madera pide ser útil.' },
      { id: 'final-tito-tirante', max: -1, texto: 'Tito arregló el carro del aserradero y ya no se queja de la caminata. Con vos habla del clima, que es su manera de quedarse un poco lejos.' },
    ],
    tobias: [
      { id: 'final-tobias', min: 3, texto: 'Tobías te deja un canto liso en el umbral cada tanto, sin avisar. «Diolch», dice cuando lo saludás, que en su casa quiere decir gracias y también buen día.' },
    ],
    herminia: [
      { id: 'final-herminia', min: 3, texto: 'Herminia te espera los domingos con una torta. Dice que a los noventa uno ya no explica quién entra.' },
    ],
    // (las dos de Nicanor son una por final: con el trato las luces siguen saliendo; con la pelea el lago quedó tranquilo y no sale ninguna)
    nicanor: [
      { id: 'final-nicanor', min: 3, solo: 'trato', texto: 'Cuando las luces vuelven al lago, Nicanor te silba desde el muelle, para tener un testigo. Vos vas.' },
      { id: 'final-nicanor-pelea', min: 3, solo: 'pelea', texto: 'En el lago ya no salen luces, y Nicanor lo lleva con resignación de pescador. Igual te silba desde el muelle a la hora de siempre, para tener compañía. Vos vas.' },
    ],
    belisario: [
      { id: 'final-belisario-casa', min: 3, texto: 'Belisario te guarda la primera historia de cada viaje y te la cuenta con el mate todavía caliente. Las mulas ya conocen el desvío a tu puerta y no hay manera de explicarles que no les queda de camino.' },
      { id: 'final-belisario', min: 2, texto: 'Belisario baja con la tropa y se detiene en tu puerta aunque no le quede de camino. Dice que es para que las mulas descansen.' },
    ],
    sofia: [
      { id: 'final-sofia-casa', min: 3, texto: 'En lo de Sofía, al lado de la foto del valle, hay otra de ella riéndose, sacada por vos. Dice que es la única que le gusta y que el mérito es de la cámara.' },
      { id: 'final-sofia', min: 2, texto: 'En el estudio de Sofía, entre los casamientos de su abuelo, hay una foto del valle con una persona chiquita en el medio, de espaldas. Ella dice que está para el tamaño.' },
    ],
  },

  // la charla de historia (una vez cada una): la del lazo alto de cada vecino, la tirante de Tito y la de después de «La luz de las cinco»
  charlas: {
    rosa: [
      { id: 'lazo-rosa-confianza', cap: 3, texto: 'Hoy te guardé una hogaza del fondo del horno, la más tostada. No me des las gracias, que me ponés nerviosa.', cuando: { lazo: { min: 2 } } },
    ],
    tito: [
      { id: 'lazo-tito-confianza', cap: 5, texto: 'Te hice una banqueta chica para la entrada del refugio, para sentarte a sacarte las botas. Una entrada sin banqueta es una fiesta sin sillas.', cuando: { lazo: { min: 2 } } },
      { id: 'lazo-tito-tirante', cap: 5, texto: 'Buen día, vecino. Lindo día para el aserradero, aunque lo tengamos tan lejos. No lo digo por nada.', cuando: { lazo: { max: -1 } } },
    ],
    tobias: [
      { id: 'lazo-tobias-confianza', cap: 5, texto: 'Si venís a la tarde a la cantera, te dejo un cajón para sentarte. Es el mío, pero ya es medio tuyo.', cuando: { lazo: { min: 2 } } },
    ],
    herminia: [
      { id: 'lazo-herminia-confianza', cap: 8, texto: 'A vos te hablo más despacio que a los demás, m\'hijo. No es la edad: es la confianza.', cuando: { lazo: { min: 2 } } },
    ],
    nicanor: [
      { id: 'lazo-nicanor-confianza', cap: 5, texto: 'Hoy el lago amaneció parejo como un espejo. Se lo iba a contar a las truchas, pero vos escuchás mejor.', cuando: { lazo: { min: 2 } } },
    ],
    belisario: [
      { id: 'lazo-belisario-confianza', cap: 8, texto: 'Para vos el mate sale sin cobrar. Para los demás, con propina. No se lo digas a nadie, que se arruina el negocio.', cuando: { lazo: { min: 2 } } },
      { id: 'belisario-opt-cruce', cap: 9, texto: 'Ando raro desde que le hablé de mi padre en el paso. Uno dice las cosas en voz alta y después las escucha. Será el mate, que suelta la lengua.', cuando: { escena: 'ultimo-cruce' } },
    ],
    sofia: [
      { id: 'lazo-sofia-confianza', cap: 7, texto: 'Me quedó un rollo con la luz de las cinco y no hay nadie más a quien quiera sacarle fotos. Tomalo como un cumplido. O como una amenaza.', cuando: { lazo: { min: 2 } } },
      { id: 'sofia-opt-valle', cap: 7, texto: 'La foto del valle está en la vidriera. La gente se para a buscarte y no te encuentra, de chiquito que saliste. Les digo que miren mejor.', cuando: { escena: 'foto-valle' } },
      { id: 'sofia-opt-frente', cap: 9, texto: 'Sigo mirando la foto en la que me río. No me reconozco, pero me cae bien la que sale. Gracias por apretar la pera, che.', cuando: { escena: 'del-otro-lado' } },
    ],
  },

  // las optativas de Sofía (la foto del valle, de la 4.18.2) y las del acto III de la 4.19.0 (Belisario y Sofía), en el tablón «De paso»
  tablon: {
    'foto-valle': { caps: [7, 8], quien: 'sofia', titulo: 'La foto del valle', ofrecida: 'Sofía, la fotógrafa, quiere sacar el valle entero desde la puerta del estudio. Le falta una persona chiquita en el medio y una tarde sin apuro.', hecha: 'Sofía sacó el valle con vos en el medio, de espaldas, con la luz de las cinco. Quedó en el estudio, entre los casamientos de su abuelo.' },
    'ultimo-cruce': { caps: [9, 10, 11], quien: 'belisario', titulo: 'El último cruce', ofrecida: 'Belisario sale con la última tropa antes de que la nieve tape el paso. Está en el Puesto del Paso, cargando las mulas, y hay mate.', hecha: 'Belisario te habló de la huella de su padre y te convidó un mate antes de salir con la última tropa. Las mulas saludaron a alguien que vos no viste.' },
    'del-otro-lado': { caps: [9, 10, 11], quien: 'sofia', titulo: 'Del otro lado de la cámara', ofrecida: 'Sofía tiene una idea y una cámara de fuelle: esta vez te toca a vos apretar la pera. Está en el estudio de fotos, de día.', hecha: 'Le sacaste una foto a Sofía, riéndose. Quedó en el estudio y en el borde hay una mano chiquita que ella le atribuye al viento.' },
  },

  raro: {
    'foto-del-valle': { titulo: 'La foto del valle', texto: 'Sofía sacó el valle desde la puerta del estudio con la luz de las cinco, y yo en el medio, de espaldas. En la copia, al lado de mis botas, hay dos puntitos verdes. Ella dice que es el vidrio.', cap: 7, donde: 'estudio de fotos' },
    'mulas-saludan': { titulo: 'Las mulas saludan', texto: 'En el Puesto del Paso, las siete mulas de Belisario miraron hacia el valle a la vez, con las orejas para adelante. En el barro, junto a las pezuñas, había huellas chiquitas y descalzas que acompañaban a la tropa hasta el borde del puesto y no seguían.', cap: 9, donde: 'Puesto del Paso' },
    'foto-de-sofia': { titulo: 'La foto de Sofía', texto: 'Le saqué una foto a Sofía, riéndose, en el estudio. En el borde, afuera de lo que ella miraba, hay una mano chiquita sosteniendo el reflector. Ella dice que fue el viento. Adentro no había viento.', cap: 9, donde: 'estudio de fotos' },
  },
};

// ¿El lazo `n` está dentro de { min?, max? }? La misma regla que la condición `lazo` de las escenas (sin min o sin max, no hay tope de ese lado).
export function lazoCumple(rango, n) {
  const r = rango && typeof rango === 'object' ? rango : {};
  const v = Math.trunc(Number(n) || 0);
  const min = r.min === undefined || r.min === null ? -9 : Number(r.min);
  const max = r.max === undefined || r.max === null ? 9 : Number(r.max);
  return v >= min && v <= max;
}

// Las líneas de epílogo que corresponden a los lazos de la partida, en orden fijo (VECINOS_LAZO). `lazoDe`: (quien) => número.
// 4.19.0: `final` es el final de la partida, 'trato' o 'pelea' (el que arma tarjetaFinal). Una línea con `solo` sale únicamente con ese final; si no se dice el final
// (o es otra cosa), las líneas con `solo` no salen (mejor ninguna que la del final que no es). Las que no traen `solo` valen con cualquiera.
export function finalDeLazos(lazoDe, final) {
  const f = typeof lazoDe === 'function' ? lazoDe : () => 0;
  const cual = final === 'trato' || final === 'pelea' ? final : null;
  const salida = [];
  for (const quien of VECINOS_LAZO) {
    const lista = Object.hasOwn(TEXTO_LAZOS.final, quien) ? TEXTO_LAZOS.final[quien] : [];
    const l = lista.find((x) => lazoCumple(x, f(quien)) && (x.solo === undefined || x.solo === cual));
    if (l) salida.push(l.texto);
  }
  return salida;
}

// La frase corta de la guía para ese vecino y esa palabra del lazo, o null (frío y las que el guion no justifica no tienen).
export function fraseDeGuia(quien, palabra) {
  const g = Object.hasOwn(TEXTO_LAZOS.guia, quien) ? TEXTO_LAZOS.guia[quien] : null;
  return g && Object.hasOwn(g.frases, palabra) ? g.frases[palabra] : null;
}
