// 4.18.2 (B): los textos de los LAZOS de los vecinos que no tenían (Rosa, Tito, Tobías, Herminia, Nicanor, Belisario y Sofía) de la Historia
// («El trato del molino») como DATOS. Módulo puro y sin imports (así A lo puede importar desde historia.js sin ciclos). Lo escribe el agente B;
// lo enchufa el agente A. Las claves son las del lazo (`lazo:<quien>:<n>`). Sin inglés: se traduce todo al final. Nunca hay números a la vista:
// lo que se muestra es la palabra del lazo (palabraLazo: frío, tirante, conocido, de confianza, de la casa).
//   · guia[quien]   = { nombre, rol, frases }       el nombre para la guía y la tarjeta de decisión, quién es, y una frase corta por palabra del lazo
//                                                   (`conocido`, `de confianza`, `de la casa`, y `tirante` sólo donde el guion lo justifica: Tito).
//   · final[quien]  = [{ id, min?, max?, texto }]   la línea de epílogo: la primera de la lista cuyo rango contiene al lazo (ver finalDeLazos).
//   · charlas[quien]= [{ id, cap, texto, cuando }]  líneas de la «charla de historia»: `cuando` es { lazo: { min?, max? } } (la del lazo) o
//                                                   { escena } (la de después de la escena de Sofía). Valen aunque el capítulo ya haya pasado.
//   · tablon[id]    = { caps, quien, titulo, ofrecida, hecha }   como TEXTO_OPTATIVAS.tablon, para la optativa nueva de Sofía.
//   · raro[id]      = { titulo, texto, cap, donde }              el cuaderno de lo raro (el id es el del efecto `raro:<id>` de la escena).
// Alcance con las escenas de hoy (lo comprueba la prueba): Rosa, Tito, Tobías, Herminia y Nicanor llegan a 3 (Nicanor con dos encargos); Belisario y Sofía
// sólo a 2 (Sofía a 3 si el registro le da +1 a «Foto para Sofía»): por eso sus líneas piden 2.

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
      { id: 'final-rosa', min: 3, texto: 'Rosa te guarda el primer pan de cada mañana, el más tostado. Dice que es costumbre y no cariño. Lo dice con la boca llena.' },
    ],
    tito: [
      { id: 'final-tito', min: 3, texto: 'Tito te hizo un banco de lenga para el umbral, derecho como una regla, y no lo cobró. Dice que la madera pide ser útil.' },
      { id: 'final-tito-tirante', max: -1, texto: 'Tito arregló el carro del aserradero y ya no se queja de la caminata. Con vos habla del clima, que es su manera de quedarse un poco lejos.' },
    ],
    tobias: [
      { id: 'final-tobias', min: 3, texto: 'Tobías te deja un canto liso en el umbral cada tanto, sin avisar. «Diolch», dice cuando lo saludás, que en su casa quiere decir gracias y también buen día.' },
    ],
    herminia: [
      { id: 'final-herminia', min: 3, texto: 'Herminia te espera los domingos con una torta y la puerta sin llave. Dice que a los noventa uno ya no explica quién entra.' },
    ],
    nicanor: [
      { id: 'final-nicanor', min: 3, texto: 'Cuando salen las luces sobre el lago, Nicanor te silba desde el muelle, para tener un testigo. Vos vas.' },
    ],
    belisario: [
      { id: 'final-belisario', min: 2, texto: 'Belisario baja con la tropa y se detiene en tu puerta aunque no le quede de camino. Dice que es para que las mulas descansen.' },
    ],
    sofia: [
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
    ],
    sofia: [
      { id: 'lazo-sofia-confianza', cap: 7, texto: 'Me quedó un rollo con la luz de las cinco y no hay nadie más a quien quiera sacarle fotos. Tomalo como un cumplido. O como una amenaza.', cuando: { lazo: { min: 2 } } },
      { id: 'sofia-opt-valle', cap: 7, texto: 'La foto del valle está en la vidriera. La gente se para a buscarte y no te encuentra, de chiquito que saliste. Les digo que miren mejor.', cuando: { escena: 'foto-valle' } },
    ],
  },

  // la optativa nueva de Sofía, en el tablón «De paso»
  tablon: {
    'foto-valle': { caps: [7, 8, 9, 10], quien: 'sofia', titulo: 'La foto del valle', ofrecida: 'Sofía, la fotógrafa, quiere sacar el valle entero desde la puerta del estudio. Le falta una persona chiquita en el medio y una tarde sin apuro.', hecha: 'Sofía sacó el valle con vos en el medio, de espaldas, con la luz de las cinco. Quedó en el estudio, entre los casamientos de su abuelo.' },
  },

  raro: {
    'foto-del-valle': { titulo: 'La foto del valle', texto: 'Sofía sacó el valle desde la puerta del estudio con la luz de las cinco, y yo en el medio, de espaldas. En la copia, al lado de mis botas, hay dos puntitos verdes. Ella dice que es el vidrio.', cap: 7, donde: 'estudio de fotos' },
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
export function finalDeLazos(lazoDe) {
  const f = typeof lazoDe === 'function' ? lazoDe : () => 0;
  const salida = [];
  for (const quien of VECINOS_LAZO) {
    const lista = Object.hasOwn(TEXTO_LAZOS.final, quien) ? TEXTO_LAZOS.final[quien] : [];
    const l = lista.find((x) => lazoCumple(x, f(quien)));
    if (l) salida.push(l.texto);
  }
  return salida;
}

// La frase corta de la guía para ese vecino y esa palabra del lazo, o null (frío y las que el guion no justifica no tienen).
export function fraseDeGuia(quien, palabra) {
  const g = Object.hasOwn(TEXTO_LAZOS.guia, quien) ? TEXTO_LAZOS.guia[quien] : null;
  return g && Object.hasOwn(g.frases, palabra) ? g.frases[palabra] : null;
}
