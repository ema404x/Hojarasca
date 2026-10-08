// La guía del juego: qué hacer, de dónde sale cada recurso y cómo se construye.
// Módulo puro (sin three ni DOM) para poder probarlo en Node; `modo` filtra las
// secciones que sólo valen para el Relax o para el Desafío.

export const SECCIONES_GUIA = [
  {
    id: 'primeros', titulo: 'Primeros pasos', modo: 'relax',
    items: [
      ['Caminá y mirá', 'WASD para moverte, el mouse para mirar. Cuando algo se puede usar, abajo aparece la tecla que lo hace.'],
      ['Anotá lo que encuentres', 'Plantas, aves y lugares se anotan con E al acercarte. El cuaderno (J) guarda todo y dice qué falta.'],
      ['Hacé fuego', 'Juntá tres ramitas con E y apretá F en un lugar despejado. Junto al fuego podés cocinar (G) y dormir.'],
      ['Tu primer refugio', 'Juntá troncos y piedra con el hacha (H), aserrá tablas (Y) y abrí los planos con O.'],
    ],
  },
  {
    id: 'primeros-desafio', titulo: 'Primeros pasos', modo: 'desafio',
    items: [
      ['El objetivo', 'Cada noche, a las 20:30, salen los duendes del bosque. Resistí hasta el amanecer. Después de la noche 20 despierta el Coihue Viejo.'],
      ['El día es para preparar', 'Talá árboles, picá piedra, aserrá tablas, fabricá armas (K) y levantá defensas (O) alrededor de tu base.'],
      ['Lo primero', '1) Talá un árbol con H. 2) Fabricá la lanza con K. 3) Levantá dos tramos de empalizada y un portón. 4) Poné una antorcha.'],
      ['Si caés', 'Perdés las semillas doradas y un 30% de los troncos, tablas y piedras, y amanecés en la base. La cabaña y las defensas se quedan.'],
    ],
  },
  {
    id: 'recursos', titulo: 'Recursos: de dónde sale cada cosa',
    items: [
      ['Troncos', 'Arrimate a un coihue o una lenga con el hacha y apretá H tres veces: el árbol se viene abajo y te da 4 troncos. Un tronco suelto en el suelo da 3 de un golpe. El pehuén no se tala.'],
      ['El bosque vuelve', 'Donde talaste queda un tocón que rebrota solo: a los pocos días hay un renoval y a los nueve, el árbol entero. Plantar un renoval al lado (B) apura el rebrote.'],
      ['Tablas', 'Con el hacha, Y aserra un tronco en cualquier lado: a mano rinde 2 tablas. En un banco de carpintero (o en el galpón de esquila) rinde 4.'],
      ['Piedra', 'Las rocas grises del suelo (pedreros) se pican con H: cada una da 4 piedras.'],
      ['Ramitas', 'Están tiradas en todo el bosque: E para juntarlas. Sirven para el fuego.'],
      ['Frutas', 'Piñones, calafates y frutillas se juntan con E. Se comen o se cocinan.'],
      ['Semillas doradas', 'Las sueltan los duendes al caer y aparecen en los troncos huecos. Sirven para las mejoras y las defensas doradas.', 'desafio'],
      ['Caja del alba', 'Cada amanecer cae una caja con paracaídas rojo cerca tuyo: pasá por encima para abrirla.', 'desafio'],
    ],
  },
  {
    id: 'construir', titulo: 'Construcción',
    items: [
      ['Abrí los planos', 'O abre los planos. Elegí uno, mirá lo que pide y marcá el lugar con el clic.'],
      ['El mapa es tuyo', 'M abre el mapa: un clic pone una chinche donde quieras, otro clic encima hace que la brújula te lleve hasta ahí, y el clic derecho la saca.'],
      ['Levantá por etapas', 'Parado junto a la obra, Y levanta la etapa siguiente si llevás los materiales. Si falta algo, el panel te dice qué y de dónde sale.'],
      ['Arrepentirse sale barato', 'Con los planos abiertos: Retroceso deshace la última etapa y te devuelve la mitad, Shift+Supr desmonta una pieza entera, y X copia lo que tenés enfrente para repetirlo con la misma orientación.'],
      ['El banco de carpintero', 'Es lo primero que conviene armar: sólo pide 4 troncos y 2 piedras, y aserrar ahí rinde el doble.'],
      ['El acopio', 'Una pila donde dejás lo que juntás (E al lado). Mientras estés cerca, lo que levantes se paga solo del acopio: se termina el ir y venir con todo encima.'],
      // 2.4
      ['Teñir la casa', 'Con los planos abiertos, T al lado de una pared, un piso o un techo tuyo lo tiñe: calafate (3 frutos), ocre (1 piedra), cal (2 piedras) o de vuelta a la madera natural.'],
      ['La galería y el invernadero', 'Van encima de lo que ya armaste. Abajo de la galería no llueve: el tendal seca y la leña no se moja. Bajo el invernadero, la huerta no se hiela en invierno.'],
      ['El hogar de piedra', 'Una pared con hogar (O → Refugios) que encaja como las otras. Se prende con F, calienta la casa como la estufa y echa humo por la chimenea.'],
      ['El embarcadero', 'El arranque en la orilla y la punta sobre el agua honda del lago. El kayak queda amarrado ahí (E lo trae) y desde la punta se pesca.'],
      ['El adarve', 'En el Desafío: una pasarela a dos metros, con escalera, para ponerla detrás de la empalizada y tirar por encima.'],
    ],
  },
  {
    id: 'defensa', titulo: 'Armas y defensas', modo: 'desafio',
    items: [
      ['El taller (K)', 'Fabricá armas, munición, emplastos y mejoras. Tab cambia de pestaña; los números eligen. El arco y las flechas piden estar junto a un banco de carpintero.'],
      ['Armas', 'Lanza (tronco + 2 piedras) para empezar; honda, arco, boleadoras y martillo después. La pistola de luz está en un cofre de los duendes, en el valle.'],
      ['Combate', 'Clic izquierdo ataca, clic derecho sostenido bloquea con la lanza. Doble toque de A o D esquiva.'],
      ['Quiénes salen', 'Duendes rastreadores, tiradores y brutos. Desde la noche 3 aparecen saltadores, que pasan la empalizada de un salto (la reforzada y el portón no). Desde la 6, escupidores de savia hirviendo que dañan las defensas de lejos.'],
      ['El capataz', 'Cada cinco noches sale uno solo, viejo, enorme y durísimo. Se da vuelta despacio: rodealo y pegale en los hongos de la espalda, que reciben el doble de daño. Al caer suelta muchas semillas doradas.'],
      ['Defensas', 'En los planos, la categoría Defensa: empalizada, portón (E abre y cierra), pirca, estacas, ballesta fija, antorchas (F las prende), torre vigía.'],
      ['Trampas', 'El foso con estacas se pone delante del paso: no frena a nadie, pero el que lo cruza se clava. Se gasta con el uso, así que cada tanto hay que rehacerlo.'],
      ['Reparar y reforzar', 'Con el martillo en la mano reparás tocando la pieza. En el taller, la pestaña Base repara y refuerza la defensa más cercana: empalizada, pirca y portón tienen su versión reforzada.'],
      ['El parte de la base', 'N abre el estado de tus defensas: cuál está rota, a qué distancia y qué conviene hacer antes de que caiga la noche.'],
      ['Curarte', 'Emplasto: 2 frutas + 1 ramita en el taller. Se usa desde la barra.'],
      ['El Coihue Viejo', 'La noche 20 despierta el Coihue Viejo, la casa de los duendes, y camina con sus raíces. Tiene tres nudos de ámbar. Cuando cae, ganaste... pero siguen saliendo: vienen de una cueva escondida en el valle.'],
      ['La cueva', 'Segundo acto. Los troncos huecos que caen traen pistas y cada una achica el cerco que el mapa dibuja a lápiz; con la tercera queda marcada. La cueva se rompe DE DÍA: de noche le tapan la boca con raíces y no le entra nada.'],
      // 3.0
      ['El asedio', 'Si al alba de la noche 20 el Coihue Viejo sigue en pie, se planta en el valle y hunde raíces en cuatro zonas: tu base, la estación, el lago y el bosque. Cada raíz le da una capa de corteza.'],
      ['Recuperar zonas', 'De día andá a una raíz (el mapa las marca), peleá con los que la cuidan y cortala. Esa noche vienen por el fogón que prendiste: si aguanta hasta el alba, la zona queda tuya.'],
      ['Adentro del Coihue', 'Con tres zonas libres se abre la puertita: andá al pie del Coihue de día y apretá E. Se sube por adentro hasta su corazón, donde está el Rey Duende: piedras de ámbar, raíces y el corazón. Si caés, el Coihue te escupe al valle y podés volver a entrar.'],
      ['Romper la cueva', 'Con el sol arriba se le abre la boca y quedan a tiro tres cunas de musgo, que se revientan de a una. Les pegan el arco, la honda, la pistola y las ballestas fijas, y también el hacha o la lanza de cerca. Con la cueva derrumbada no sale nadie más.'],
      // 2.0
      ['De noche', 'Con la linterna (L), los ojos de los duendes devuelven la luz: dos puntos en la oscuridad. Los rastreadores y los saltadores acechan: si los mirás, se frenan o se esconden; si les das la espalda, cargan. El perro gruñe hacia lo que todavía no ves.'],
      ['Encerrarte', 'Si te metés en un refugio, primero tantean: rascan las paredes y prueban la puerta. Después golpean. Lo que rompan, arreglalo de día.'],
      ['El bestiario', 'En el cuaderno (J), la pestaña Bestiario anota cada duende que ves de cerca. Peleando se aprende cómo se mueve, y al tercero que abatís, su punto débil.'],
      ['Las noches después', 'Cuando se derrumba la cueva, la pantalla final te deja elegir cinco noches más contra los duendes viejos: más duros, y se curan si los dejás respirar.'],
      ['Sonidos escritos', 'Lo que se oye de noche aparece escrito con su dirección: «[gruñido lejos · noroeste]». Se apaga en Ajustes, igual que la vibración del mando.'],
      // 2.1
      ['Rescates', 'Algunas noches atacan el lugar de un vecino: el puesto, la cabaña, el almacén o la estación. Si vas y aguanta, te lo agradece; si cae, el vecino no te habla por unos días.'],
      ['El excavador', 'Desde la noche 7. No rompe la empalizada: cava por abajo y sale cerca tuyo. Se oye cavar y se ve el polvo. Donde hay losa de piedra (O → Defensa) no puede asomar, y debajo de la madera con cimiento de piedra (taller K → Base) no se mete.'],
      ['Los capataces', 'Cada capataz es otro: el de siempre, el que llama refuerzos, la sombra que sólo se ve con la linterna y el que tira piedras a las defensas desde lejos.'],
      ['Los troncos huecos', 'Los troncos huecos de los duendes se recorren: un pasillo con hongos en el piso que largan esporas (pasalos cuando están cerrados), duendes dormidos (agachado no se despiertan) y el premio al fondo.'],
      ['La forja', 'En el taller (K), pestaña Forja: lanza de hielo (frena a los rápidos), flechas de rayo (para los grupos) y honda de empuje (derriba a los que tiran de lejos).'],
      // 2.3
      ['Los nidos de hongos', 'Desde la noche 4, al amanecer quedan nidos de hongos y musgo en el bosque. De día se queman con E y una ramita, o se rompen a golpes (sale uno flojo). Los que queden se abren a la noche y suman duendes.'],
      ['La trochita varada', 'Algunas noches el tren se queda sin presión lejos de la estación, con Elsa adentro. Avanza sólo si estás cerca: escoltalo hasta la Estación del Valle mientras los duendes van por él.'],
      ['Las lechuzas', 'Desde la noche 8, duendes montados en lechuzas. Vuelan alto y bajan en picada a apagar las antorchas; sin antorchas, vienen por vos. Arriba los alcanzan flechas, pistola y la ballesta al cielo (O → Defensa); cuando bajan, también la lanza.'],
      ['La zanja de fuego', 'Defensa nueva (O → Defensa). Se carga con dos troncos (E) y se prende (E) cuando llegan: arde un minuto. Con viento el fuego puede escaparse al pasto y quemar madera; con lluvia no prende.'],
      ['Código de partida', 'En la portada del Desafío. Con un código (o el de esta semana), las noches salen siempre iguales: sirve para comparar récords con la otra computadora o con amigos.'],
    ],
  },
  {
    id: 'vida', titulo: 'Vivir en el bosque', modo: 'relax',
    items: [
      ['Pescar', 'Q saca la caña; clic para lanzar en un río o lago.'],
      ['Moverte lejos', 'La trochita para en los apeaderos (E para subir). En la orilla hay un kayak.'],
      ['Descansar', 'R deja pasar el tiempo; junto al fuego o en un catre se duerme hasta la mañana.'],
      ['Escuchar', 'El chucao se anota por el canto, no por verlo. Agachate (C) y quedate quieto: el bosque baja, el oído llega más lejos y te dice de qué lado canta lo que todavía no anotaste.'],
      ['Esperar', 'Los animales tímidos no se persiguen: se esperan. Quedate quieto —mejor sentado o agachado— y al rato dejan de tenerte en cuenta. El pudú y el huemul se acercan solos a mirar.'],
      ['La huerta', 'En los planos (O → Trabajo) está el cantero. Con E sembrás habas o papas (semillas del almacén), o una frutilla o un calafate que juntaste; crecen con los días —la lluvia las adelanta— y con E se cosechan. Nada se seca si te olvidás: espera.'],
      ['El perro', 'Huele más lejos que vos. Cuando encuentra un animal que todavía no anotaste, va hacia ahí con la nariz en el rastro, y si te quedás atrás te espera. Seguilo: cuando está cerca, se queda duro señalando.'],
      // 2.1
      ['El grabador', 'Se cambia en el almacén por dulce de frutilla y plumas. Clic justo después de que cante un ave anotada: la graba. Si no cantó nada, hace sonar lo grabado y contesta la más cercana; el carpintero y las cachañas se acercan a ver.'],
      ['Rastros', 'A veces aparece una hilera de huellas cerca tuyo. Parado encima, E las mira: la primera vez se anotan, y siempre te dicen para dónde van. Al final está el animal.'],
      ['El tiempo', 'La lluvia entra del oeste: las nubes se ven cargar sobre la cordillera un par de horas antes, y los vecinos lo anuncian cuando los saludás.'],
      ['Conservas', 'Con las frutillas al rescoldo ya aprendidas, cuatro frutillas al fuego hacen un frasco de dulce. Cinco calafates o tres llao llao se secan en un tendal (E). Se cambian en el almacén, y en invierno se abren junto al fuego.'],
      // 2.3
      ['La colmena', 'O → Trabajo. Los canteros a menos de 18 m rinden uno más por cosecha, y cada unos días de sol hay miel (E). En invierno las abejas no salen. Pasá despacio al lado: corriendo se alborotan.'],
      ['El ahumadero', 'O → Trabajo. Con un ahumadero, de lo que pescás te quedás con dos truchas por día. Colgalas con un tronco de leña (E): en medio día salen ahumadas.'],
      ['El vivero', 'O → Trabajo. En otoño, junto a un coihue, una lenga, un ñire o un ciprés grande, E junta semilla. En el vivero germina en tres días; el plantín se planta con B y ya viene crecido a la mitad.'],
      ['La leña del invierno', 'En invierno cada fuego pide además un tronco seco. La leñera (O → Trabajo) guarda la leña seca; la que llevás encima se moja con la lluvia. Si dormís sin fuego cerca, amanecés entumecido.'],
      ['El fogón', 'Si un vecino vino de visita y hay un fuego prendido cerca de la mesa, se queda hasta tarde. Hablale de noche: al fogón se cuentan otras cosas.'],
      ['La gente', 'E para hablar. Algunos te piden encargos y te dan cosas a cambio.'],
      // 2.4
      ['La casa abriga', 'Una casa cerrada con techo no es la intemperie: sin fuego amanecés fresco, y con la estufa o el hogar prendidos el calor llega a los otros cuartos. Con buen confort (catre, alfombra, farol) te levantás descansado y caminás más liviano un rato.'],
      ['El horno de barro', 'O → Trabajo. Con un tronco y E se hornea pan casero (dos medidas de harina) o empanadas (harina, un huevo y una papa). Se guardan: la feria los cambia.'],
      ['El buzón', 'O → Exterior. Con buzón, las cartas del tren te las dejan en casa y los pedidos de fotos se mandan desde ahí.'],
      ['Tu corral', 'Un bebedero con cuatro tramos de cerco alrededor es un corral: Don Ramón te trae dos ovejas. Se esquilan con la misma tijera.'],
    ],
  },
  {
    id: 'controles', titulo: 'Teclas',
    items: [
      ['WASD · Shift · Espacio · C', 'caminar · correr · saltar · agacharte'],
      ['E', 'juntar, anotar, hablar, abrir puertas y portones'],
      ['H', 'hacha: talar árboles y picar piedra'],
      ['Y', 'aserrar tablas / levantar la etapa de una obra'],
      ['O', 'planos de construcción'],
      ['K', 'taller: armas, munición y mejoras', 'desafio'],
      ['F', 'fuego · prender antorchas'],
      ['I · 1–8', 'mochila · elegir lo que llevás en la mano'],
      ['J · M', 'cuaderno · mapa'],
      ['C + quieto', 'escuchar con atención', 'relax'],
      ['N', 'estado de la base', 'desafio'],
      ['L · Z · P', 'linterna · prismáticos · foto'],
      ['F1', 'esta guía'],
      ['Mando', 'si enchufás un joystick lo toma solo: sticks para caminar y mirar, A salta, X interactúa, R2 ataca'],
      ['Esc', 'pausa'],
    ],
  },
];

export function seccionesGuia(modo = 'relax') {
  const vale = (m) => !m || m === modo;
  return SECCIONES_GUIA.filter((s) => vale(s.modo))
    .map((s) => ({ ...s, items: s.items.filter((it) => vale(it[2])) }));
}

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function htmlGuia(modo = 'relax', activa = null) {
  const secs = seccionesGuia(modo);
  const sel = secs.find((s) => s.id === activa) || secs[0];
  const pestanas = secs.map((s) => `<button class="guia-pestana" data-guia="${s.id}" aria-pressed="${s === sel}">${esc(s.titulo)}</button>`).join('');
  const cuerpo = sel.items.map(([t, d]) => `<div class="guia-item"><h4>${esc(t)}</h4><p>${esc(d)}</p></div>`).join('');
  return `<nav class="guia-pestanas">${pestanas}</nav><div class="guia-cuerpo">${cuerpo}</div>`;
}

export const CSS_GUIA = `
#guia .panel-modal { max-width: 760px; width: calc(100vw - 32px); max-height: calc(100vh - 48px); overflow: auto; }
.guia-pestanas { display: flex; flex-wrap: wrap; gap: 6px; margin: 10px 0 14px; }
.guia-pestana { padding: 6px 12px; border-radius: 999px; font-size: 14px; opacity: .72; }
.guia-pestana[aria-pressed="true"] { opacity: 1; outline: 2px solid currentColor; }
.guia-cuerpo { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 10px 18px; }
.guia-item h4 { margin: 0 0 3px; font-size: 16px; }
.guia-item p { margin: 0; font-size: 14px; line-height: 1.45; opacity: .9; }
`;
