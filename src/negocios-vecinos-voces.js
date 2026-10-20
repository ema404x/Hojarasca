// 4.4 · Lo que dice cada vecino cuando le hablás de su negocio (comprarlo, ser socio, retirarte, las cuentas). Cada uno con su voz, la de vecindad-voces.js.
// Las reglas (negocios-vecinos.js) deciden QUÉ pasa (qué tipo de reacción, a qué precio, si se queda); acá está cómo lo dice cada uno.
//   · `compra[tipo]`: la reacción a la oferta (`ofendido`, `se-niega`, `resiste`, `pide-mas`, `acepta-condiciones`, `acepta`); {precio} es lo que pide;
//   · `cierre.queda` / `cierre['se-va']`: lo que pasa al cerrar el trato (los que no pueden irse no tienen `se-va`);
//   · `romance`: sólo Lucrecia: cómo cambia su respuesta si son novios, comprometidos o casados (o si se separaron);
//   · `socio`: `rechaza`, `resiste`, `acepta` ({pct}, {aporte}) y `cierre`; `retiro`: `aviso` ({dia}), `sale` ({devuelto}), `cancela`;
//   · `cuentas` ({ventas}, {neto}, {dias}), `caja` ({monto}), `vacia`, `espera`, `sinPlata` ({faltan}) y `sinNada`.
// Nada picante ni explícito: lo que se insinúa queda en el guiño.
export const VOCES_NEGOCIO = {
  ercilia: {
    compra: {
      ofendido: '¿Comprarme el almacén, así, de buenas a primeras? Tres generaciones de mostrador no se llevan como un kilo de yerba. Me tembló el mate, querido. Otro día, y con más confianza.',
      'se-niega': 'No, querido. Este mostrador no se vende, y menos a alguien que recién me saluda. Vení a tomar unos mates, charlamos, y después vemos.',
      resiste: '¿El almacén? Mirá que sos atrevido… Pero antes de hablar de plata, sentate: tengo que contarte de dónde viene este mostrador. Pedime «Tu historia» y después hablamos de números.',
      'pide-mas': 'Si lo querés, son {precio}. Y no es avaricia: son cuarenta años que le pesan al estante. Eso sí, yo sigo atendiendo, que sin el mostrador no sé qué hacer con las manos.',
      'acepta-condiciones': 'Hablemos, entonces. {precio}, con la libreta de mi abuela incluida y yo detrás del mostrador como siempre. Eso no se negocia, querido: la libreta y yo venimos juntas.',
      acepta: 'Ay, querido… {precio}. Y te lo dejo a vos porque sos de la casa. Tomá, ésta es la llave. Pero yo sigo atendiendo, eh, si me dejás.',
    },
    cierre: {
      queda: [
        'Ercilia se seca los ojos con el delantal. «Qué tontería, llorar por un almacén que sigue en el mismo lugar.»',
        '«Ahora el dueño sos vos y la que fía soy yo. Que no se te ocurra cambiarme los estantes sin avisar.» Sigue en el mostrador, de empleada, como siempre.',
      ],
    },
    socio: {
      rechaza: '¿Socio? Querido, las sociedades se firman entre los que se conocen bien. Tomate unos mates conmigo durante un tiempo y lo vemos.',
      resiste: 'Socio… antes escuchame un poco cómo empezó todo esto. Pedime «Tu historia»: a los socios se les cuenta.',
      acepta: 'Bueno, socios, entonces. Tu plata al cajón y a vos te toca el {pct} de lo que entre. El mostrador sigue siendo mío, eh.',
      cierre: ['Ercilia lo anota en la libreta con letra redonda: «Socio, con apretón de manos». Es lo más serio que firmó en años.'],
    },
    retiro: {
      aviso: 'Te querés retirar… bueno, querido, la libreta no discute. En dos días te cuento lo que te toca, hasta el último centavo.',
      sale: 'Ercilia te cuenta la plata dos veces sobre el mostrador. «Para que después no digas.» Te devuelve {devuelto} más lo que había en tu parte.',
      cancela: '¿Te quedás? Menos mal. La libreta ya estaba ensayando una cara larga.',
    },
    cuentas: 'Fijate en la libreta: ayer vendimos {ventas} y, descontado lo de Nélida, la reposición y los impuestos, quedaron {neto} limpios. Todo anotado, como mi abuela.',
    caja: 'Acá tenés lo que juntó el cajón: {monto}. Contalo, que a mí me gusta que se cuente delante.',
    vacia: 'El cajón está vacío, querido. Todavía no entró nada de lo tuyo.',
    espera: 'Hoy no me hables de eso, que todavía tengo el mate frío. Otro día.',
    sinPlata: 'Me gusta la idea, pero te faltan {faltan} para cerrar. Volvé cuando los tengas, que el almacén no se va a ningún lado.',
    sinNada: '¿Hablar del almacén? Siempre. Preguntame lo que quieras.',
  },
  galesa: {
    compra: {
      ofendido: '¿Mi casa de té? Cariad, la tetera de mi nain cruzó el océano. Una no vende eso a quien apenas conoce, ni por todo el oro de Trevelin. Me quedé sin palabras, y mirá que no es mi costumbre.',
      'se-niega': 'No, cariad. La casa de té no está en venta, y menos para alguien con quien todavía no compartí ni una torta. Vení por la galería y hablamos de otras cosas.',
      resiste: 'Ay, cariad… antes de hablar de números tenés que saber por qué abrí esta casa. Pedime «Tu historia» y volvé: así sabés lo que comprás.',
      'pide-mas': 'Si es en serio, son {precio}. Es lo que valen las mesas, la cocina y mis seis años de amasar de madrugada. Y yo me quedo en la galería: nadie sirve el té como yo, con perdón de la modestia.',
      'acepta-condiciones': '{precio}, y dos condiciones: la tetera de mi nain no entra en el trato y yo sigo sirviendo en la galería. Con eso… diolch, firmo.',
      acepta: '{precio}, cariad. Te lo vendo a vos porque sé que las tazas van a estar bien. Pero me quedo, ¿eh? La casa de té sin mí es sólo una casa.',
    },
    cierre: {
      queda: [
        'Ceinwen se queda un momento callada, con la mano sobre la tetera. «Mi nain estaría contenta. Y algo asustada, es verdad.»',
        '«Desde hoy el cartel dice tu nombre. Mi tarea es la misma: que nadie se vaya de la galería sin una torta en el estómago.» Sigue sirviendo, de empleada, como siempre.',
      ],
    },
    socio: {
      rechaza: 'Socia de la casa de té… cariad, eso se hace con quien ya es de la familia. Vení a tomar el té muchas tardes, y después hablamos.',
      resiste: 'Con gusto, pero antes escuchá de dónde viene esta casa. Pedime «Tu historia»: a una socia se le cuenta todo.',
      acepta: 'Hecho, entonces. Ponés tu parte y te toca el {pct} de lo que dé la galería. Prometo no usar tu parte para comprar más harina… sin avisarte.',
      cierre: ['Ceinwen sirve dos tazas: «Por la sociedad. Diolch, cariad.» Ésta es la primera vez que usa las de la repisa de arriba.'],
    },
    retiro: {
      aviso: 'Entiendo, cariad. Las sociedades también son como el té: algunas se enfrían. En dos días te tengo lista tu parte.',
      sale: 'Ceinwen te trae el sobre y un pedazo de torta negra para el camino. Te devuelve {devuelto} más lo que juntaste. «Volvé a la galería cuando quieras, sin sociedad.»',
      cancela: '¿Te quedás? Qué alegría, cariad. La torta negra ya se había puesto triste.',
    },
    cuentas: 'La galería estuvo llena: ayer entraron {ventas} y, descontados el horno, los ingredientes y la moza del salón, quedaron {neto}. Cuarenta tazas lavadas, cariad.',
    caja: 'Acá tenés lo de la caja de la casa de té, cariad: {monto}. Y llevate un scone, que ya está tibio.',
    vacia: 'La caja está vacía, cariad. Los scones se acaban rápido, pero la caja tarda en llenarse.',
    espera: 'Hoy no, cariad, que se me enfría la tetera. Otro día me hablás de eso.',
    sinPlata: 'Me encanta la idea, cariad, pero te faltan {faltan}. Cuando los tengas, la tetera sigue acá.',
    sinNada: 'Preguntame lo que quieras de la casa de té, cariad.',
  },
  moza: {
    compra: {
      ofendido: '¿A mí me vas a comprar la cantina? Corazón, a la barra se llega invitando una copa y haciendo reír, no con un fajo. Andá y volvé cuando sepas cómo me gusta el café. Me ofendiste, y no me ofendo fácil.',
      'se-niega': 'Corazón, la cantina no está en venta, y menos para quien todavía no me conoce el nombre completo. Sentate, tomá algo y hablamos de otras cosas. De ésta, no.',
      resiste: 'Mirá vos… querés la cantina. Antes de ponerle precio, escuchame cómo llegué hasta acá. Pedime «Tu historia», que la barra no se entrega sin saber de quién viene.',
      'pide-mas': '{precio}, cariño. No es caro: es la barra, las mesas, la guitarra de mi tío y mis noches hasta las dos. Y me quedo yo detrás, que la cantina sin su moza es un galpón con sillas.',
      'acepta-condiciones': 'Escuchame bien: {precio}, la guitarra de mi tío se queda en la pared y yo me quedo detrás de la barra. El cartel lo cambiás, la moza no. ¿Trato?',
      acepta: 'Ay, corazón… {precio}. Tuya, entonces. Me hacés el favor de no cambiarme de lugar los tragos y yo te hago el favor de seguir sonriendo. Es un buen trato para los dos.',
    },
    romance: {
      novios: '«Y ahora me comprás la barra de la que ya sos cliente fijo. Mirá vos.» Se ríe, se acomoda el pañuelo. «Por ser vos: {precio}. Y por esta vez, la cuenta la invita la casa.»',
      comprometidos: '«¿Comprarme la cantina? Si ya te di lo que no se vende.» Te guiña un ojo. «Por ser vos, {precio}, y en cuanto firmemos, la moza sigue siendo tuya… digo, de la casa. Dejalo así.»',
      casados: '«Si lo mío es tuyo, la cantina ya es tuya, ¿no? Pero a los papeles los pone Amadeo.» Se ríe. «{precio}, para que figure: y la moza sigue en la barra, que te vea trabajar a vos de patrón.»',
      separados: 'Se acomoda el pañuelo sin mirarte. «Ah, ahora querés la cantina. Es lo único que me quedó de la época de tenerte cerca. {precio} y ni una palabra de más, corazón.»',
    },
    cierre: {
      queda: [
        'Lucrecia pasa un trapo por la barra, aunque ya brilla. «Qué raro, ver mi nombre sin estar el cartel. Si lo cambiás, que sea por uno lindo.»',
        '«Seguiré siendo la moza. De empleada, pero con las llaves en el bolsillo: me quedé con la copia, por las dudas.» Y te sonríe de costado.',
      ],
    },
    socio: {
      rechaza: '¿Socio de la cantina, vos? Corazón, a la barra se le entra de a poco: primero te conozco, después te invito, después veremos. Todavía no es el momento.',
      resiste: 'Socios… antes escuchame cómo llegué hasta acá. Pedime «Tu historia»: a los que ponen plata en mi barra les cuento todo, hasta lo que no pregunten.',
      acepta: 'Dale, socios. Ponés tu parte y te toca el {pct} de lo que caiga en la caja. Pero la barra es mía, eh, que hay cosas que no se comparten.',
      cierre: ['Lucrecia abre una botella del fondo de la barra y sirve dos medidas chicas. «Por la sociedad. Y porque me caés bien, que es más raro todavía.»'],
    },
    retiro: {
      aviso: 'Te vas… qué lástima, cariño. Está bien, en dos días te tengo todo contado. Y vení igual, aunque no seas socio: la barra te extraña.',
      sale: 'Lucrecia te alcanza el sobre sobre la barra, con un guiño. Te devuelve {devuelto} más lo que juntaste. «Vení a gastarlo acá, que se pierde menos.»',
      cancela: '¿Te quedás? Ay, corazón, qué buena noticia. Me asustaste, y yo no me asusto.',
    },
    cuentas: 'Anoche pasó de todo: entraron {ventas} y, entre las copas que regalé, la guitarra y las empanadas, quedaron {neto} limpios. El que no vino se lo perdió.',
    caja: 'Acá tenés lo de la caja de la barra: {monto}. Contalo, que de la plata se cuida el que la cuenta.',
    vacia: 'La caja está vacía, corazón. La noche todavía no hizo su trabajo.',
    espera: 'Hoy no, cariño, que estoy de mal humor y la barra se enfría. Mañana, si querés.',
    sinPlata: 'Me gusta cómo hablás, pero te faltan {faltan}. Volvé cuando los tengas: la barra no se va a ningún lado.',
    sinNada: 'Sobre la cantina te cuento lo que quieras, corazón. Menos una cosa, pero ésa no la preguntes.',
  },
  panadera: {
    compra: {
      ofendido: '¿Mi panadería? Ni siquiera nos conocemos, m\'hijo. La masa madre es la única que sabe quién soy y no la vendo a un extraño. Me quedé tiesa como una tortita seca.',
      'se-niega': 'No, m\'hijo, la panadería no se vende. Menos a alguien con quien apenas crucé tres palabras. Pasá a comprar pan y charlamos.',
      resiste: 'Sin conocernos mucho, ¿no? Bueno… pero la panadería tiene una historia. Si querés oírla, pedime «Tu historia» y después hablamos de plata.',
      'pide-mas': '{precio}. Es lo que cuesta un horno con treinta años de amor, una tanda a las cuatro de la mañana y mi nombre sobre la puerta. Si lo cerramos, me voy a descansar un poco de tanto horno.',
      'acepta-condiciones': '{precio}, y la masa madre se queda en su frasco y el frasco, conmigo. Yo sigo amasando a las cuatro. ¿Qué te parece?',
      acepta: '{precio}, m\'hijo. Y te lo digo con cariño: qué buena idea. Hace años que quiero que alguien me ayude a cargar con las cuentas mientras yo hago pan. Sí, firmo.',
    },
    cierre: {
      queda: [
        'Rosa se saca la harina de las manos. «A las siete hay pan con tu nombre, ya ves. Y yo sigo, de empleada, que el horno me espera.»',
        '«La masa madre dice que te acepta. Le pregunté yo, claro.»',
      ],
      'se-va': [
        'Rosa guarda el delantal y ata el frasco de la masa madre con una toalla. «Me voy a dar una vuelta por el pueblo. A las cuatro vuelvo a amasar, que no sé estar sin eso.»',
        '«El horno es tuyo y queda en manos de una ayudante que me recomendó Gladys. Ella amasa, yo vigilo desde la plaza.»',
      ],
    },
    socio: {
      rechaza: '¿Socio en la panadería? M\'hijo, eso se le ofrece a quien ya conoce el horno. Pasá por la panadería más seguido y lo charlamos.',
      resiste: 'Antes de eso, sentate y escuchá cómo llegué hasta acá. Pedime «Tu historia».',
      acepta: 'Dale. Ponés tu parte y a vos te toca el {pct} de lo que dé el horno. Prometo no gastarlo todo en harina.',
      cierre: ['Rosa te alcanza un pan tibio. «Los socios comen primero.»'],
    },
    retiro: {
      aviso: 'Te querés retirar. Bueno, m\'hijo, es tu plata. En dos días te tengo todo contado.',
      sale: 'Rosa te alcanza un pan tibio con el sobre: te devuelve {devuelto} más lo que juntaste. «Pasá igual cuando quieras, el pan no se pone celoso.»',
      cancela: '¿Te quedás? ¡Qué bueno! Me habías dejado la masa en suspenso.',
    },
    cuentas: 'Ayer salieron {ventas} de pan y facturas; descontadas la harina, la leña y la ayudante, quedaron {neto}. La masa madre estuvo de buen humor.',
    caja: 'Acá está lo que juntó la panadería: {monto}. Y llevate un pan, que se enfría.',
    vacia: 'No hay nada en la caja todavía, m\'hijo. El pan se vende rápido, pero hay que esperar la tanda.',
    espera: 'Hoy no, m\'hijo, que tengo la tanda en el horno. Otro día.',
    sinPlata: 'Te quiero, pero te faltan {faltan}. Cuando los tengas, el horno sigue prendido.',
    sinNada: 'De la panadería te cuento lo que quieras, m\'hijo.',
  },
  herrero: {
    compra: {
      ofendido: '¿Mi herrería? No. Ni a vos ni a nadie que no me haya dado la mano antes. El yunque tiene más memoria que vos. Fuera.',
      'se-niega': 'No. La herrería no se vende, y menos a alguien que no sé cómo golpea el hierro. Volvé cuando nos conozcamos más.',
      resiste: 'La herrería es mía por una razón. Pedime «Tu historia» y después hablamos del precio.',
      'pide-mas': '{precio}. El yunque pesa más que yo, y la fragua nunca se apagó. Es lo que vale. Si lo cerramos, me voy a golpear hierro por mi cuenta.',
      'acepta-condiciones': '{precio}, y el yunque de mi abuelo no entra en el trato: se queda en su lugar. Con eso, firmo.',
      acepta: '{precio}. Hace tiempo que quería soltar las cuentas y quedarme con el martillo. Tomá, la llave de la fragua. No dejes que se enfríe.',
    },
    cierre: {
      queda: [
        'Anselmo se queda mirando el yunque un buen rato. «Cuarenta años de hierro y me río de vos por cuatro monedas. Qué cosa.»',
        '«Sigo golpeando de empleado. Si algún día se te ocurre cambiar el fuelle, avisame.»',
      ],
      'se-va': [
        'Anselmo cuelga el delantal junto a la herradura de la puerta. «Me voy a probar suerte con las herramientas por mi cuenta. Pero vengo cuando haga falta.»',
        '«La fragua queda a cargo de un muchacho que aprendió conmigo. Va a andar bien: le dejé el yunque limpio.»',
      ],
    },
    socio: {
      rechaza: '¿Socio? No te conozco tanto. Cuando hayamos golpeado juntos, hablamos.',
      resiste: 'Antes de nada, escuchá un poco de mi historia. Pedila.',
      acepta: 'Trato hecho. Ponés tu parte y te toca el {pct}. Lo que no hace falta decir se sobreentiende.',
      cierre: ['Anselmo te da la mano con la palma callosa. «Socios.» Es todo lo que dice, pero se le nota en la cara.'],
    },
    retiro: {
      aviso: 'Está bien. En dos días te cuento todo. No me debés explicaciones.',
      sale: 'Anselmo te da el sobre sin decir mucho: te devuelve {devuelto} más lo que juntaste. «Pasá por la fragua cuando quieras, sin deber nada.»',
      cancela: 'Bueno. Seguimos entonces.',
    },
    cuentas: 'Ayer se hicieron trabajos por {ventas}; entre el carbón, el hierro y el muchacho de la fragua, quedaron {neto}. Poco hablar, mucho yunque.',
    caja: 'Acá está la caja de la herrería: {monto}. Contala, no me gusta que se dude.',
    vacia: 'No hay nada todavía. El hierro se trabaja lento.',
    espera: 'Hoy no. Estoy con el hierro en el fuego.',
    sinPlata: 'Te faltan {faltan}. Volvé cuando los tengas.',
    sinNada: 'De la herrería, lo que quieras.',
  },
  pescador: {
    compra: {
      ofendido: '¿La pescadería? Vecino, no. Ni a vos ni a nadie que no me conozca. Con el lago no se bromea. Me ofendiste.',
      'se-niega': 'No, vecino. Todavía no nos conocemos lo suficiente. Volvé cuando hayamos salido juntos al agua.',
      resiste: 'Sin conocernos mucho no vendo. Pedime «Tu historia», que es larga y mojada.',
      'pide-mas': '{precio}, vecino. Es lo que valen las redes, el bote y el ahumadero. Si lo cerramos, me voy a pescar a otra orilla.',
      'acepta-condiciones': '{precio}, y mi bote no entra. Se queda amarrado en el muelle y sale conmigo. Ahí sí, trato.',
      acepta: '{precio}. Hace tiempo que quiero alguien que se ocupe del mostrador mientras yo salgo. Con vos sí. Tomá la llave.',
    },
    cierre: {
      queda: [
        'Aurelio mira el lago desde la puerta. «Se va a seguir pescando igual, vecino. La diferencia es que ahora las cuentas las llevás vos.»',
        '«Sigo con las redes, de empleado. Si el lago se enoja, sabés a quién culpar.»',
      ],
      'se-va': [
        'Aurelio carga las cañas en el bote. «Me voy a otra orilla, a pescar por mi cuenta. Cuando haya truchas grandes, te traigo una.»',
        '«El mostrador queda con un ayudante del muelle. Que no se le mojen los papeles.»',
      ],
    },
    socio: {
      rechaza: 'Socios no. Sin haber salido al lago juntos, no.',
      resiste: 'Antes escuchá cómo llegué al lago. Pedime «Tu historia».',
      acepta: 'Bueno, socios: ponés tu parte y te toca el {pct}. Si el lago anda flojo, no me eches la culpa.',
      cierre: ['Aurelio te da la mano mojada. «Socios. Mañana temprano salimos.»'],
    },
    retiro: {
      aviso: 'Bueno, vecino. En dos días te tengo contado todo.',
      sale: 'Aurelio te alcanza el sobre sobre el muelle: te devuelve {devuelto} más lo que juntaste. «Para la próxima, salimos juntos igual.»',
      cancela: 'Menos mal. Ya me estaba acostumbrando a tu mate.',
    },
    cuentas: 'Ayer se vendieron {ventas} entre truchas frescas y ahumadas. Menos redes, el ayudante y el ahumadero: {neto}. El lago estuvo generoso.',
    caja: 'Acá tenés la caja de la pescadería, vecino: {monto}. Contala, no me ofendo.',
    vacia: 'No hay nada en la caja. El lago tardó en dar.',
    espera: 'Hoy no, vecino. Estoy con las redes.',
    sinPlata: 'Te faltan {faltan}. Volvé cuando los tengas.',
    sinNada: 'Preguntame lo que quieras del lago, vecino.',
  },
  tejedora: {
    compra: {
      ofendido: '¿La hilandería? No. Un telar no se vende a quien no sabe leer un poncho. Me ofendiste.',
      'se-niega': 'No, querido. Todavía no nos conocemos lo suficiente. Volvé cuando sepas qué es un buen punto.',
      resiste: 'Antes de eso, escuchá de dónde vienen mis dibujos. Pedime «Tu historia».',
      'pide-mas': '{precio}. Son telares, lana, tintes y años de dedos dormidos. Si lo cerramos, me llevo el witral a mi casa.',
      'acepta-condiciones': '{precio}, y el poncho del baúl no entra en el trato: se queda conmigo. Con eso, trato.',
      acepta: '{precio}. Hace años que sueño con alguien que lleve las cuentas y me deje el peine. Con vos sí. Tomá la llave.',
    },
    cierre: {
      queda: [
        'Elvira pasa los dedos por el peine. «Qué raro: tanto tiempo dueña y ahora sólo tejedora. Se ve más bonito el telar así.»',
        '«Sigo de empleada, entonces. Si necesitás un poncho, el primero va por mi cuenta.»',
      ],
      'se-va': [
        'Elvira recoge su witral y un ovillo de lana morada. «Me voy a tejer a mi casa, con mis tintes. Pero cuando haya que tejer algo especial, me avisás.»',
        '«El telar grande queda en manos de una aprendiza. Que no lo toque cuando está tensando.»',
      ],
    },
    socio: {
      rechaza: 'Socio no. Aún no nos conocemos.',
      resiste: 'Antes, escuchá. Pedime «Tu historia».',
      acepta: 'Bueno, socios. Ponés tu parte y te toca el {pct}. Si hay poncho de más, va por tu cuenta.',
      cierre: ['Elvira te da un ovillo de lana. «Para que no te falte abrigo.»'],
    },
    retiro: {
      aviso: 'Bueno. En dos días te cuento todo.',
      sale: 'Elvira te entrega el sobre doblado como un poncho: te devuelve {devuelto} más lo que juntaste. «Pasá igual a ver cómo avanza el telar.»',
      cancela: 'Menos mal. El telar te extrañaba.',
    },
    cuentas: 'Ayer se vendieron {ventas} en ponchos y mantas. Menos la lana, los tintes y las ayudantes: {neto}. El telar no se quejó.',
    caja: 'Acá tenés la caja de la hilandería: {monto}. Con un poncho, a cualquiera se lo cobro doble.',
    vacia: 'Nada todavía. La lana tarda en volverse plata.',
    espera: 'Hoy no, querido. Tengo la urdimbre tensada.',
    sinPlata: 'Te faltan {faltan}. Volvé cuando los tengas.',
    sinNada: 'De la hilandería, lo que quieras.',
  },
  apicultor: {
    compra: {
      ofendido: '¿La sala de miel? Caro, no. Las abejas me conocen y a vos no. Me ofendiste.',
      'se-niega': 'No, amico. Todavía no. Las abejas necesitan conocerte primero.',
      resiste: 'Antes, escuchá cómo llegué a las abejas. Pedime «Tu historia».',
      'pide-mas': '{precio}. Son colmenas, cajones, años de paciencia y la miel de notro. Si lo cerramos, me llevo mis abejas favoritas a otro lado.',
      'acepta-condiciones': '{precio}, y mis seis cajones favoritos no entran: se quedan conmigo. Con eso, trato.',
      acepta: '{precio}. Hace tiempo que quiero alguien que lleve las cuentas y me deje las abejas. Con vos sí. Tomá la llave.',
    },
    cierre: {
      queda: [
        'Guido se sacude el sombrero de red. «Las abejas dicen que sí. Les pregunté.»',
        '«Sigo de empleado, entonces. Vos las cuentas, yo el zumbido.»',
      ],
      'se-va': [
        'Guido ajusta su sombrero de red. «Me voy a probar con mis propios cajones, en el bosque. Pero las abejas de acá me conocen: vuelvo seguido.»',
        '«La sala queda en manos de una aprendiza. Hablale bajito a las abejas.»',
      ],
    },
    socio: {
      rechaza: 'Socio no, amico. Primero tenés que conocer a las abejas.',
      resiste: 'Antes, escuchá. Pedime «Tu historia».',
      acepta: 'Dale, socios. Ponés tu parte y te toca el {pct}. Prometo no pelearme con las abejas.',
      cierre: ['Guido te da un frasco de miel. «Por la sociedad. Dulce, como corresponde.»'],
    },
    retiro: {
      aviso: 'Bene. En dos días te cuento todo.',
      sale: 'Guido te alcanza el sobre con un frasco: te devuelve {devuelto} más lo que juntaste. «Las abejas te siguen conociendo.»',
      cancela: 'Menos mal. Las abejas se habían puesto nerviosas.',
    },
    cuentas: 'Ayer se vendieron {ventas} en miel y cera. Menos los frascos, el ayudante y las colmenas: {neto}. Las abejas, tranquilas.',
    caja: 'Acá tenés la caja de la sala de miel, caro: {monto}. Contala despacito.',
    vacia: 'Nada todavía. La miel tarda en volverse plata.',
    espera: 'Hoy no, amico. Tengo los cajones abiertos.',
    sinPlata: 'Te faltan {faltan}. Volvé cuando los tengas.',
    sinNada: 'De la sala de miel, lo que quieras, caro.',
  },
};
// Amadeo, el gerente: lo que cuenta de los negocios del pueblo (no tiene uno propio, pero lleva los libros de todos)
export const VOZ_GERENTE = {
  intro: 'De los negocios del pueblo sé lo que dicen los libros: quién vende, a cuánto y cómo viene la mano. Lo que el banco no sabe es cuánto vale cada local para su dueño. Eso se lo tiene que preguntar a cada uno.',
  sinNada: 'Todavía no tiene negocios ni sociedades. Hable con el dueño del local que le interese, y pida «Hablar de su negocio»: según cuánto lo conozcan, el trato será uno u otro. Los libros dicen que los precios van de $80.000 a $200.000.',
  conAlgo: 'Veamos sus cuentas. Se lo digo como lo anoto en el libro:',
  recomendacion: 'Un consejo de banco: pase a ver sus negocios cada tanto. Un dueño que no aparece rinde menos, y una caja llena no sigue llenándose.',
  cajaLlena: 'Y ojo: hay caja llena por ahí. Lo que pase del tope se pierde.',
};
