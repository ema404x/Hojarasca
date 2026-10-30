// 4.18.0 (B): los textos de las SUBTRAMAS OPTATIVAS de la Historia («El trato del molino», GUION_HISTORIA.md §6 y los bloques «Optativas» de cada
// capítulo) como DATOS. Módulo puro. Lo escribe el agente B; lo enchufa el agente A (el registro de optativas, el tablón y el cuaderno).
//   · tablon[id]  = { caps, quien, titulo, ofrecida, hecha }   la entrada del tablón de historia de CADA optativa del guion (las 27): `ofrecida`
//                   es la pista mientras está abierta; `hecha`, la línea que queda tildada. `quien`: la persona del guion (como en la charla).
//   · objetos[id] = { nombre, texto }                          los objetos de historia nuevos (el frasco de la repisa)
//   · raro[id]    = { titulo, texto, cap, donde }              el cuaderno de lo raro: los ids son los de los efectos `raro:<id>` de las escenas
//                                                              de historia-escenas-optativas.js
//   · charla[quien] = [{ id, cap, texto, cuando }]             la línea «de después» de cada optativa (la que el vecino dice una vez hecha):
//                   `cuando` es { escena } (la escena vista que la cumple) o, si la optativa no tiene escena (un encargo), { optativa }.
// Sin inglés: se traduce todo al final.

export const TEXTO_OPTATIVAS = {
  tablon: {
    // acto I
    'frasco-masa-madre': { caps: [1, 2], quien: 'rosa', titulo: 'El frasco de la repisa', ofrecida: 'La masa madre de Eusebio, de 1987, está en la repisa del refugio. Rosa, la panadera, sabría qué hacer con ella.', hecha: 'Rosa tiene la masa de Eusebio. Los martes, harina y agua tibia.' },
    'oveja': { caps: [2], quien: 'ramon', titulo: 'La oveja de Ramón', ofrecida: 'Si una oveja de Ramón se escapa para el lado de las piedras, dale una mano para volver.', hecha: 'La Porfiada volvió al corral. Por ahora.' },
    'banco-primero': { caps: [2], quien: 'ramon', titulo: 'El banco primero', ofrecida: 'Ramón dice que al lado del banco cada tronco rinde el doble. Es su encargo.', hecha: 'El banco está firme. Ramón lo golpeó con el palo y no bailó.' },
    'encargo': { caps: [3], quien: 'ercilia', titulo: 'Un encargo de algún vecino', ofrecida: 'En el tablón de la plaza siempre hay alguien que necesita una mano.', hecha: 'Hiciste un encargo para un vecino. Así se entra al valle: de a uno.' },
    'fermin-pan': { caps: [3], quien: 'fermin', titulo: 'Pedido de Fermín', ofrecida: 'Fermín no pide. Pero si pasás por el galpón de esquila con pan o harina, no te va a decir que no.', hecha: 'Pan en la estepa, a medias, como las ovejas.' },
    'vuelta-ingeniera': { caps: [4], quien: 'graciela', titulo: 'Una vuelta para la ingeniera', ofrecida: 'Llevá a Graciela en la trochita a dos lugares lindos: el mirador del pehuén, el faro o la casa de té.', hecha: 'Graciela vio el valle sin la planilla. No anotó nada, que en ella es mucho.' },
    'vuelta-completa': { caps: [4], quien: 'elsa', titulo: 'La vuelta completa', ofrecida: 'Elsa quiere ver si sabés hacer la vuelta entera del ramal, de punta a punta.', hecha: 'La vuelta completa, sin frenar de más. Elsa dice que el tren te escucha.' },
    // acto II
    'trigo-abuelo': { caps: [5], quien: 'josefina', titulo: 'El trigo del abuelo', ofrecida: 'Josefina tiene algo para mostrarte en la seccional. Le cuesta: andá vos.', hecha: 'La foto del carro del abuelo de Josefina, cargado de trigo para el molino.' },
    'tablas-tito': { caps: [5], quien: 'tito', titulo: 'Las tablas de Tito', ofrecida: 'Tito te compra seis tablas del coihue grande, si las querés vender.', hecha: 'Seis tablas de coihue, vendidas en la carpintería.' },
    'truchas': { caps: [5], quien: 'nicanor', titulo: 'Primeras truchas del otoño', ofrecida: 'Nicanor dice que el lago anda contento. Andá a pescar con él.', hecha: 'Las primeras truchas del otoño, con Nicanor en el muelle.' },
    'masa-crece': { caps: [6], quien: 'rosa', titulo: 'La masa que crece sola', ofrecida: 'A Rosa le crece la masa madre de noche, con marcas de deditos. Quiere compañía una noche en la panadería.', hecha: 'Una noche en la panadería. La puerta del horno se cerró sola.' },
    'foto-sofia': { caps: [6], quien: 'sofia', titulo: 'Foto para Sofía', ofrecida: 'La foto movida que sacaste en el lago: Sofía, la fotógrafa, sabría mirarla.', hecha: 'Sofía agrandó la foto. «Esto no es una mancha. Esto es un ojo.»' },
    'tres-de-tres': { caps: [6], quien: 'nicanor', titulo: 'Tres de tres', ofrecida: 'El encargo de pesca de Nicanor: tres de tres, o nada.', hecha: 'Tres de tres. Nicanor dice que fue suerte. Lo dice contento.' },
    'concurso': { caps: [7], quien: 'ercilia', titulo: 'Concurso del dulce', ofrecida: 'El concurso del dulce de otoño: con dulce de calafate, Ercilia se pone contenta.', hecha: 'Tu dulce de calafate en el concurso de otoño.' },
    'fermin-habla': { caps: [7], quien: 'fermin', titulo: 'Fermín quiere hablar', ofrecida: 'Después de la minga, Fermín te buscó con la mirada. Está en el galpón de esquila.', hecha: 'Belisario le ofreció irse con las mulas. Fermín no se lo dijo a Ramón.' },
    'veta-vuelve': { caps: [8], quien: 'tobias', titulo: 'La veta que vuelve', ofrecida: 'Tobías te espera de noche en la cantera. Quiere que veas algo.', hecha: 'Una veta rellena de cantos blancos, como el de tu umbral. Diez son tuyos.' },
    'mulas': { caps: [8], quien: 'belisario', titulo: 'Las mulas de Belisario', ofrecida: 'Belisario baja la tropa de mulas al mallín. Le vendría bien alguien a caballo.', hecha: 'El zaino es hijo de la yegua «mansa» que Belisario le vendió a Ramón.' },
    'noventa': { caps: [8], quien: 'herminia', titulo: 'Herminia y los noventa', ofrecida: 'Herminia cumple noventa. Una torta no se le niega a nadie.', hecha: 'La llavecita de bronce de Herminia, la que encontró de nena en una raíz.' },
    // acto III
    'papel-elsa': { caps: [9], quien: 'elsa', titulo: 'El papel de Elsa', ofrecida: 'Elsa anda rara. En el andén se le cayó algo que no querría que viera nadie.', hecha: 'Le devolviste el papel a Elsa. Ya no te dice pasajero.' },
    'visita-ramon': { caps: [9], quien: 'ramon', titulo: 'Visitar a Ramón', ofrecida: 'Ramón está en el puesto sanitario, mirando la pared. Llevale algo rico.', hecha: 'Hablaron de Chocolate. Ramón se dejó cuidar un rato.' },
    'trochita-nieve': { caps: [9], quien: 'elsa', titulo: 'La trochita en la nieve', ofrecida: 'El encargo de temporada: la trochita en la nieve. Cada flete cuenta para el ramal.', hecha: 'La trochita pasó con nieve hasta los estribos. El ramal lo anotó.' },
    'juntar-ovejas': { caps: [9], quien: 'ramon', titulo: 'Juntar las ovejas', ofrecida: 'La tranquera del corral amaneció abierta y las ovejas andan desparramadas por la ladera. Hay que juntarlas antes del arroyo.', hecha: 'Las ovejas, juntas. En el poste quedó un piolín colorado.' },
    'llave-79': { caps: [10, 11], quien: 'josefina', titulo: 'La llave del 79', ofrecida: 'La llave de hierro que te dejaron abre algo del valle. Probala en las cerraduras viejas.', hecha: 'El cajón del molino viejo: una foto de tres jóvenes con una bolsa de trigo.' },
    'pedir-perdon': { caps: [10, 11], quien: 'herminia', titulo: 'Pedir perdón', ofrecida: 'No cambia lo que pasó. Pero en la raíz del coihue se puede dejar algo.', hecha: 'Dejaste algo en la raíz del coihue. Queda dicho.' },
    'flechas-de-mas': { caps: [11], quien: 'tito', titulo: 'Flechas de más', ofrecida: 'Con más plumas y puntas, Tito te arma un segundo atado de flechas.', hecha: 'Un segundo atado, derecho como una regla.' },
    'cumple-nevada': { caps: [11], quien: 'ercilia', titulo: 'El cumpleaños que no se suspende', ofrecida: 'Hay un cumpleaños en la aldea. Viene la nevada, pero los cumpleaños no se suspenden.', hecha: 'Fuiste igual al cumpleaños, con la nevada encima.' },
    'alguien-te-espera': { caps: [11, 12, 13], quien: 'pareja', titulo: 'Alguien que te espera', ofrecida: 'La noche antes de la nevada, alguien quiere verte un rato en su lugar favorito.', hecha: 'Una noche tranquila antes de la nevada. Te pidió que tengas cuidado.' },
    'volver-a-subir': { caps: [13], quien: 'ramon', titulo: 'Volver a subir', ofrecida: 'Ramón se sienta en la loma a mirar el corral vacío. Llevale el mate y esperá.', hecha: 'Una hora en la loma, sin hablar. Fue suficiente.' },
  },

  // la descripción de los objetos de historia nuevos (cuando los mirás en la mochila o en la repisa)
  objetos: {
    'frasco-masa-madre': { nombre: 'El frasco de la repisa', texto: 'Vidrio grueso, una tela atada con piolín y una etiqueta que dice «1987». Adentro, la masa madre de Eusebio, que respira despacio. Come los martes.' },
  },

  // el cuaderno de lo raro: indicios con fecha y lugar. Los ids son los de los efectos `raro:<id>` de las escenas de las optativas.
  raro: {
    'frasco-de-1987': { titulo: 'Masa de 1987', texto: 'Debajo del frasco que no había que tocar había una nota que decía que lo toque. Eusebio pensaba en todo.', cap: 1, donde: 'refugio' },
    'la-porfiada': { titulo: 'La Porfiada', texto: 'La oveja que se escapa todos los veranos para el lado de las piedras. Eusebio decía que iba a visitar a alguien.', cap: 2, donde: 'Puesto Alto' },
    'pan-en-la-estepa': { titulo: 'Pan en la estepa', texto: 'Fermín espantó un chimango con un cascote, sin mirar. Dice que es costumbre de cuando espantaba zorros.', cap: 3, donde: 'galpón de esquila' },
    'graciela-en-el-mirador': { titulo: 'La vía, desde arriba', texto: 'Graciela midió el valle con el lápiz, como su abuelo con la pala del carbón. Abrió la libreta y no anotó nada.', cap: 4, donde: 'mirador del pehuén' },
    'graciela-en-el-faro': { titulo: 'Botas de oficina', texto: 'A Graciela se le mojó una bota en el faro y se rió. En Trevelin también contaban cosas del agua.', cap: 4, donde: 'faro' },
    'ovejas-juntas': { titulo: 'El piolín colorado', texto: 'Junté las ovejas. En el poste de la tranquera había un piolín colorado, con el nudo de la bolsa de Eusebio.', cap: 9, donde: 'corral de Ramón' },
  },

  // la línea «de después» de cada optativa que no la tenía (los actos ya traen las de truchas, masa-crece, fermin-habla, veta-vuelve y noventa).
  // Misma regla que charlaDe3: la última cuyo capítulo ya llegó y cuya condición se cumple.
  charla: {
    rosa: [
      { id: 'rosa-opt-frasco', cap: 2, texto: 'La masa de Eusebio come como un peón y crece como un chico. Los martes le doy harina y le hablo bajito, como decía la nota.', cuando: { escena: 'frasco-rosa' } },
    ],
    ramon: [
      { id: 'ramon-opt-porfiada', cap: 2, texto: 'La Porfiada anda mansita desde que la trajiste. Mansita para ella, digo: hoy se escapó una sola vez.', cuando: { escena: 'oveja-ramon' } },
      { id: 'ramon-opt-zaino', cap: 8, texto: '¿Belisario te contó lo del zaino? No le creas la mitad. La otra mitad, sí, por desgracia.', cuando: { escena: 'mulas-belisario' } },
      { id: 'ramon-opt-visita', cap: 9, texto: 'Gracias por la visita, m\'hijo. Desde que hablamos de Chocolate, a las seis me pica un poco menos la mano.', cuando: { escena: 'visita-ramon' } },
      { id: 'ramon-opt-ovejas', cap: 9, texto: 'Me contaron que me juntaste las ovejas. Y que en la tranquera había un piolín colorado. No me digas nada más, m\'hijo.', cuando: { escena: 'juntar-ovejas' } },
      { id: 'ramon-opt-foto', cap: 10, texto: 'Qué flaco estaba en esa foto. Qué flaco y qué zonzo. Y Eusebio con la bolsa al hombro, haciéndose el fuerte.', cuando: { escena: 'llave-79' } },
      { id: 'ramon-opt-loma', cap: 13, texto: 'Gracias por subir a la loma. No hablamos nada y fue lo mejor que hablé en todo el año.', cuando: { escena: 'volver-a-subir' } },
    ],
    fermin: [
      { id: 'fermin-opt-pan', cap: 3, texto: 'Todavía me acuerdo del pan. En la estepa las cosas ricas duran poco y se recuerdan mucho.', cuando: { escena: 'pan-fermin' } },
      { id: 'fermin-opt-ovejas', cap: 9, texto: 'Las ovejas desparramadas no son cosa de zorro. El zorro se lleva una. Esto fue alguien que quería que miremos.', cuando: { escena: 'juntar-ovejas' } },
    ],
    graciela: [
      { id: 'graciela-opt-mirador', cap: 4, texto: 'Desde el mirador la vía parece un piolín. Lo escribí así en el margen del informe. Mi jefe no va a entender nada.', cuando: { escena: 'vuelta-mirador' } },
      { id: 'graciela-opt-faro', cap: 4, texto: 'Se me mojaron las botas en el faro. Las dejé secar en la ventana del almacén y Ercilia ya se lo contó a media aldea.', cuando: { escena: 'vuelta-faro' } },
    ],
    elsa: [
      { id: 'elsa-opt-te', cap: 4, texto: 'La ingeniera volvió de la casa de té con migas de bizcocho en el sobretodo. Algo le pasó, pasajero. Algo bueno.', cuando: { escena: 'te-graciela' } },
      { id: 'elsa-opt-papel', cap: 9, texto: 'Ya sabe dónde guardo los papeles que no mando: en el bolsillo de adentro, al lado del silbato. No me haga hablar.', cuando: { escena: 'papel-elsa' } },
    ],
    josefina: [
      { id: 'josefina-opt-carro', cap: 5, texto: 'La foto del carro la puse en la ventana de la seccional. Julia dice que mi abuelo tenía mi misma cara de enojada.', cuando: { escena: 'trigo-abuelo' } },
      { id: 'josefina-opt-foto', cap: 10, texto: 'La foto de los tres está arriba de mi escritorio. Mi abuelo en el medio, riéndose. Nunca lo vi reírse así.', cuando: { escena: 'llave-79' } },
    ],
    tito: [
      { id: 'tito-opt-tablas', cap: 5, texto: 'Las tablas que me vendiste ya son una mesa. Me quedó linda. Me quedó tan linda que me da culpa.', cuando: { escena: 'tablas-tito' } },
      { id: 'tito-opt-flechas', cap: 11, texto: 'El segundo atado me salió más derecho que el primero. El primero lo hice con miedo y el segundo con bronca.', cuando: { escena: 'flechas-de-mas' } },
    ],
    sofia: [
      { id: 'sofia-opt-ojo', cap: 6, texto: 'Agrandé tu foto movida. Es un ojo. La colgué en el estudio y la gente se para a mirarla sin saber por qué.', cuando: { escena: 'foto-sofia' } },
    ],
    ercilia: [
      { id: 'ercilia-opt-dulce', cap: 7, texto: 'Tu dulce de calafate está en mi vidriera, querido, con un cartelito escrito a mano. Lo vendo carísimo.', cuando: { optativa: 'concurso' } },
      { id: 'ercilia-opt-cumple', cap: 11, texto: 'Viniste al cumpleaños con la nevada encima. Eso en una aldea no se olvida, querido. Nunca.', cuando: { escena: 'cumple-nevada' } },
    ],
    belisario: [
      { id: 'belisario-opt-zaino', cap: 8, texto: 'El zaino que tenés es hijo de mi yegua mansa. Mansa conmigo, digo. Con Ramón fue otra cosa, y todavía me lo cobra.', cuando: { escena: 'mulas-belisario' } },
    ],
    herminia: [
      { id: 'herminia-opt-perdon', cap: 10, texto: 'Dicen que dejaste algo en la raíz del coihue. Pedir perdón es como golpear antes de abrir: no arregla, pero avisa.', cuando: { escena: 'pedir-perdon' } },
    ],
  },
};

const tiene = (conj, id) => (conj instanceof Set ? conj.has(id) : Array.isArray(conj) && conj.includes(id));

// La línea «de después» de un vecino en el capítulo `cap`, entre las de las optativas: la última cuyo capítulo ya llegó y cuya condición se cumple
// (entre las del mismo capítulo, la primera de la lista). null si no hay. `estado`: { escenas: Set|array, optativas: Set|array } — `optativas`
// son las HECHAS (sólo la usa la línea del concurso, que no tiene escena).
export function charlaOptativas(quien, capitulo, estado = {}) {
  const lista = Object.hasOwn(TEXTO_OPTATIVAS.charla, quien) ? TEXTO_OPTATIVAS.charla[quien] : [];
  const ok = (l) => {
    if (l.cap > capitulo) return false;
    const w = l.cuando || {};
    if (w.escena) return tiene(estado.escenas, w.escena);
    if (w.optativa) return tiene(estado.optativas, w.optativa);
    return false;
  };
  const validas = lista.filter(ok);
  if (!validas.length) return null;
  const tope = Math.max(...validas.map((l) => l.cap));
  return validas.find((l) => l.cap === tope);
}

// La entrada del tablón de una optativa: { titulo, texto } (la pista si está abierta, la línea tildada si está hecha). null si no existe.
export function tablonDe(id, hecha = false) {
  const t = Object.hasOwn(TEXTO_OPTATIVAS.tablon, id) ? TEXTO_OPTATIVAS.tablon[id] : null;
  return t ? { titulo: t.titulo, texto: hecha ? t.hecha : t.ofrecida } : null;
}
