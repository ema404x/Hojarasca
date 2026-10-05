// Encargos: lo que te piden Josefina, Ramón y Nicanor, y cómo se sabe que están cumplidos
export const ENCARGOS = [
  {
    id: 'e-arboles', quien: 'ema', titulo: 'Los cinco árboles',
    pedido: 'Te propongo algo. Anotá en tu cuaderno los cinco árboles grandes del bosque: coihue, lenga, arrayán, ciprés y pehuén. Cuando los tengas, vas a mirar el bosque distinto.',
    resumen: 'Anotar coihue, lenga, arrayán, ciprés y pehuén.',
    listo: 'Los cinco anotados. Ahora ya sabés leer una ladera de lejos: dónde hay agua, dónde pega el viento, dónde se quemó hace años.',
    cumplido: (p) => ['coihue', 'lenga', 'arrayan', 'cipres', 'pehuen'].every((k) => p.entradas[k]),
  },
  {
    id: 'e-carpintero', quien: 'ema', titulo: 'El golpeteo doble',
    requiere: ['e-arboles'],
    pedido: 'Necesito una foto del carpintero gigante para el registro. Seguí el golpeteo doble y usá los prismáticos; si te acercás de a poco no se va.',
    resumen: 'Sacarle una foto a un carpintero gigante.',
    listo: 'Esa foto vale. Donde hay carpinteros grandes hay árboles viejos, y los árboles viejos son los que sostienen todo lo demás.',
    cumplido: (p) => !!p.desafios['f-carpintero'],
  },
  // ---- Don Ramón enseña el oficio antes que nada
  {
    id: 'e-madera', quien: 'ramon', titulo: 'Madera para el invierno',
    pedido: 'Lo primero que tenés que aprender es sacar madera sin arruinar el monte. Con el hacha, tres golpes y el árbol cae: cuatro troncos. Al pehuén no lo toques, ese es sagrado. Traeme doce tablas aserradas y hablamos.',
    resumen: 'Juntar 12 tablas: talá con H y aserrá con Y.',
    listo: 'Doce tablas. Ahora ya sabés lo que cuesta cada una, y por qué el que sabe no tala más de lo que necesita.',
    premio: { materiales: { piedra: 6 }, texto: '6 piedras del pedrero de Ramón' },
    cumplido: (p) => (p.materiales?.tabla || 0) + (p.acopio?.tabla || 0) >= 12,
  },
  {
    id: 'e-banco', quien: 'ramon', titulo: 'El banco primero',
    requiere: ['e-madera'],
    pedido: 'Un consejo de viejo: antes que nada, armate el banco de carpintero. Cuesta cuatro troncos y dos piedras, y al lado de él cada tronco te rinde el doble. El que empieza por el banco termina antes.',
    resumen: 'Construir un banco de carpintero (O → Trabajo).',
    listo: 'Ese banco te va a ahorrar media vida de hachazos. Guardalo bajo techo si podés.',
    premio: { materiales: { tronco: 4, tabla: 4 }, texto: '4 troncos y 4 tablas' },
    cumplido: (p) => (p.obras || []).some((o) => o.plano === 'banco-trabajo' && o.etapas >= 1),
  },
  {
    id: 'e-acopio', quien: 'ramon', titulo: 'Dejar de cargar todo',
    requiere: ['e-banco'],
    pedido: 'Te veo ir y venir con el monte encima. Armate un acopio al lado de donde estés construyendo, guardá ahí lo que juntás y levantá tranquilo: mientras estés cerca, la obra se paga sola del acopio.',
    resumen: 'Armar un acopio y guardar 20 materiales adentro.',
    listo: 'Ahora sí trabajás como la gente: se junta una vez y se construye tranquilo.',
    premio: { materiales: { tabla: 6 }, texto: '6 tablas' },
    cumplido: (p) => (p.obras || []).some((o) => o.plano === 'acopio' && o.etapas >= 1)
      && ['tronco', 'tabla', 'piedra'].reduce((s, k) => s + (p.acopio?.[k] || 0), 0) >= 20,
  },
  {
    id: 'e-lugares', quien: 'ramon', titulo: 'Las cuatro puntas',
    pedido: 'Si querés conocer el valle de verdad, tenés que pisar las cuatro puntas: el mirador, mi puesto, el faro y la estación. Después hablamos.',
    resumen: 'Llegar al mirador, al Puesto Alto, al faro y a la estación.',
    listo: 'Ya caminaste el valle entero. Eso no lo aprende nadie mirando un mapa.',
    cumplido: (p) => ['mirador', 'puesto', 'faro', 'estacion'].every((k) => p.entradas[k]),
  },
  {
    id: 'e-puesto', quien: 'ramon', titulo: 'Levantar lo tuyo',
    requiere: ['e-banco'],
    pedido: 'Te voy a decir algo: el que anda por el monte necesita un techo propio. Conseguite el hacha en el almacén, juntá de lo caído —nunca de lo que está en pie— y levantate un puesto. Cuatro paredes y un techo, nada más. Después me contás.',
    resumen: 'Levantar tu propio puesto de troncos.',
    listo: 'Así que lo levantaste. Ahora ya sabés lo que cuesta cada tabla. Ese puesto te va a durar más que vos, si lo cuidás.',
    cumplido: (p) => (p.obras || []).some((o) => o.plano === 'puesto' && o.etapas >= 4),
  },
  {
    id: 'e-fuego', quien: 'ramon', titulo: 'Piñones al fuego',
    pedido: 'Juntá tres piñones al pie de una araucaria, hacete un fuego y tostalos. Comerlos calientes en el bosque es otra cosa.',
    resumen: 'Tostar piñones en una fogata.',
    listo: 'Eso que probaste alimentó gente acá durante siglos. No es poca cosa para una semilla.',
    cumplido: (p) => !!p.entradas['pinones-tostados'],
  },
  {
    id: 'e-pesca', quien: 'nicanor', titulo: 'Tres de tres',
    pedido: 'A ver si podés: sacá una arcoíris, una marrón y una de arroyo. Las tres, y las tres devueltas al agua.',
    resumen: 'Pescar y devolver arcoíris, marrón y trucha de arroyo.',
    listo: 'Tres de tres. Ya sabés leer el agua: dónde para el pez, a qué hora come, cuándo no vale la pena insistir.',
    cumplido: (p) => ['arcoiris', 'marron', 'fontinalis'].every((k) => p.peces[k]),
  },
  {
    id: 'e-vuelta', quien: 'guarda', titulo: 'La vuelta completa',
    requiere: ['e-tren'],
    pedido: 'Te propongo algo: quedate arriba y dale la vuelta entera al anillo, sin bajarte en ninguna parada. Son un par de kilómetros. Vas a ver el valle de una manera que caminando no se ve.',
    resumen: 'Dar la vuelta completa al anillo sin bajarte.',
    listo: 'La vuelta entera. Ahora ya sabés cómo se ve el valle desde la ventanilla: el lago de un lado, la cordillera del otro y el bosque pasando siempre.',
    cumplido: (p) => (p.vueltas || 0) >= 1,
  },
  {
    id: 'e-tren', quien: 'nicanor', titulo: 'Subite una vez',
    pedido: 'Hacete un favor: esperá el tren en el andén y subite. Va despacio, mira todo. Después contame si no da ganas de quedarse arriba.',
    resumen: 'Viajar una vez en la trochita.',
    listo: 'Da ganas de quedarse arriba, ¿viste? Es el único tren que te deja mirar el bosque sin apurarlo.',
    cumplido: (p) => !!p.entradas.viaje,
  },
  {
    id: 'e-nocturno', quien: 'ema', titulo: 'Turno de noche',
    requiere: ['e-arboles'],
    pedido: 'Una más: el bosque de noche es otro bosque. Escuchá al concón y buscá los murciélagos justo cuando se va la luz. Anotá los dos.',
    resumen: 'Anotar el concón y el murciélago orejudo.',
    listo: 'Ahora ya sabés que el bosque no se apaga a la noche: cambia de turno. Los de día duermen y salen los otros.',
    cumplido: (p) => p.entradas.concon && p.entradas.murcielago,
  },
  {
    id: 'e-invasoras', quien: 'ramon', titulo: 'Los de afuera',
    requiere: ['e-lugares'],
    pedido: 'Quiero que veas con tus ojos a los tres que trajeron de afuera: el ciervo colorado, el jabalí y la liebre. Están por todos lados, y ese es justamente el problema.',
    resumen: 'Ver ciervo colorado, jabalí y liebre europea.',
    listo: 'Tres animales que no deberían estar y sin embargo mandan. Cuidar un bosque no es solo cuidar lo lindo: también es sacar lo que sobra.',
    cumplido: (p) => ['ciervo', 'jabali', 'liebre'].every((k) => p.entradas[k]),
  },
  {
    id: 'e-cocina', quien: 'nicanor', titulo: 'La mesa del bosque',
    requiere: ['e-fuego'],
    pedido: 'Probá las tres cosas que da este lugar: los piñones, el dulce de calafate y las frutillas al rescoldo. Después contame cuál te gustó.',
    resumen: 'Cocinar piñones, dulce de calafate y frutillas.',
    listo: 'Las frutillas, ¿no? A todos les gustan las frutillas. Comer lo que junta uno mismo tiene otro gusto.',
    cumplido: (p) => ['pinones-tostados', 'dulce-calafate', 'frutillas-brasas'].every((k) => p.entradas[k]),
  },
  {
    id: 'e-renovales', quien: 'ema', titulo: 'Devolver lo que sacaste',
    requiere: ['e-arboles', 'e-madera'],
    pedido: 'Si talás, plantá. Juntá piñones o calafates y plantá tres renovales; si los ponés junto a un tocón, el rebrote se apura. En diez días no te vas a acordar de dónde estaba el tocón.',
    resumen: 'Plantar tres renovales.',
    listo: 'Tres renovales. Eso que hiciste no lo vas a ver terminado vos, y está bien que sea así.',
    premio: { ramitas: 6, texto: '6 ramitas secas' },
    cumplido: (p) => (p.renovales || []).length >= 3,
  },
  {
    id: 'e-chinches', quien: 'guarda', titulo: 'Tu propio mapa',
    pedido: 'El mapa es mío, pero las marcas tienen que ser tuyas. Abrilo con M y poné tres chinches donde te importe: un pedrero, una laguna, el lugar donde dejaste algo. La brújula te lleva hasta la que elijas.',
    resumen: 'Poner tres chinches en el mapa (M, clic).',
    listo: 'Tres marcas propias. Un mapa ajeno te dice dónde están las cosas; el tuyo te dice qué te importa.',
    premio: { materiales: { tabla: 3 }, texto: '3 tablas para el atril' },
    cumplido: (p) => (p.chinches || []).length >= 3,
  },
  {
    id: 'e-nocheagua', quien: 'nicanor', titulo: 'La picada de la tarde',
    requiere: ['e-pesca'],
    pedido: 'Andá al lago cuando esté por caer el sol y tirá ahí donde el agua se pone oscura. Sacá dos truchas después de las siete. A esa hora comen sin mirar.',
    resumen: 'Pescar dos truchas después de las 19:00.',
    listo: 'Esa es la hora. El resto del día se pesca; a esa hora se saca.',
    premio: { cosa: 'mosca', texto: 'una mosca atada a mano' },
    cumplido: (p) => (p.pescaTarde || 0) >= 2,
  },
  // ---- 1.10: el zaino. Ramón te lo presta cuando ya caminaste el valle.
  {
    id: 'e-caballo', quien: 'ramon', titulo: 'El zaino',
    requiere: ['e-lugares'],
    pedido: 'Ya caminaste el valle de punta a punta: ahora te lo puedo prestar. El zaino es manso y conoce todo. Pero la montura no tiene pelero, y sin pelero le paspa el lomo. Traeme dos vellones de la majada del galpón y te lo ensillo.',
    resumen: 'Llevarle dos vellones de lana a Don Ramón para el pelero.',
    listo: 'Así se ensilla. Te espera atado al palenque, al lado de la puerta del refugio. W al tranco, con apuro al galope, y no lo metas al agua honda que no le gusta. Cuidámelo.',
    premio: { cosa: 'caballo', texto: 'el zaino, ensillado' },
    cumplido: (p) => (p.materiales?.lana || 0) + (p.acopio?.lana || 0) >= 2,
  },
  // ---- 1.10: Ercilia, la del almacén. Sus encargos llegan por carta (`carta`): hasta
  // que la trochita no la trae, no hay nada que pedir.
  {
    id: 'e-correo', quien: 'ercilia', carta: 'c-casa', titulo: 'Contestar las cartas',
    pedido: 'Mirá, acá el correo llega con el tren y se lo lleva el tren. Si vas a recibir cartas, las tenés que contestar, que si no la gente se preocupa. Cuando hayas leído cuatro, contame, que te doy algo para el viaje de vuelta de la tuya.',
    resumen: 'Recibir y leer cuatro cartas en el almacén.',
    listo: 'Cuatro cartas. Se nota que alguien te extraña. Tomá, un paquete de yerba para que tomes unos mates mientras contestás.',
    premio: { cuenta: { yerba: 8 }, texto: 'un kilo de yerba' },
    cumplido: (p) => ['c-casa', 'c-esquel', 'c-tejedora', 'c-ramal', 'c-naturalista', 'c-vuelta'].filter((id) => p.entradas?.[id]).length >= 4,
  },
  {
    id: 'e-verdura', quien: 'ercilia', carta: 'c-esquel', titulo: 'Verdura para el pueblo',
    pedido: 'Ya leíste lo de mi hermana. En Esquel la verdura llega en el camión del martes, medio machucada. Si juntás seis puñados de habas y cuatro papas de tu cantero, se las mando con el tren. Rosa paga en semilla, y la de ella es buena.',
    resumen: 'Juntar seis habas y cuatro papas de tu cantero.',
    listo: 'Esto sí es verdura. Rosa va a estar contenta. Tomá la semilla que mandó: papa de la buena, de la que le trae el agrónomo.',
    premio: { cuenta: { 'semillas-papa': 4 }, texto: 'cuatro papas para semilla' },
    cumplido: (p) => (p.entradas?.haba?.cantidad || 0) >= 6 && (p.entradas?.papa?.cantidad || 0) >= 4,
  },
  {
    id: 'e-lana', quien: 'ercilia', carta: 'c-tejedora', titulo: 'Lana para Amalia',
    pedido: 'Amalia es la que teje las mantas grises, las que te gustaron. Si le juntás seis vellones de la majada del galpón, le hacés el invierno. La tijera la tengo acá, si todavía no tenés.',
    resumen: 'Juntar seis vellones de lana (en la mochila o en el acopio).',
    listo: 'Seis vellones y bien esquilados, enteros. Amalia te manda esto: lo que le sobró de tablas a su marido cuando hizo el telar nuevo.',
    premio: { materiales: { tabla: 6 }, texto: 'seis tablas' },
    cumplido: (p) => (p.materiales?.lana || 0) + (p.acopio?.lana || 0) >= 6,
  },
  // ---- El cierre. Josefina abrió la lista con los cinco árboles; le toca cerrarla.
  // No pide nada nuevo: pide volver, que a esta altura es lo único que falta.
  {
    id: 'e-valle', quien: 'ema', cierre: true, titulo: 'Lo que aprendiste',
    pedido: 'Ya no me queda nada para pedirte. Hiciste todo lo que se le puede pedir a alguien que recién llega: aprendiste a sacar madera sin arruinar el monte, a devolver lo que sacaste, a leer el agua y a caminar el valle de punta a punta. Así que te pido lo último y es lo más fácil: volvé a verme cuando quieras y charlamos un rato, como se charla entre los que conocen el lugar.',
    resumen: 'Volver a hablar con Josefina.',
    listo: 'Listo. Ya no sos alguien que anda por acá: sos alguien de acá. El bosque no se termina de conocer nunca, pero ya sabés lo suficiente como para que te deje quedarte. Llevate estas cosas del almacén, que las vas a necesitar más que nosotros.',
    premio: { cosas: ['mosca', 'farol', 'manta', 'yerba'], texto: 'la mosca, el farol, la manta y la yerba' },
    cumplido: (p) => ENCARGOS.every((e) => e.cierre || p.encargos?.[e.id] === 'hecho'),
  },
];

export const ENCARGO = Object.fromEntries(ENCARGOS.map((e) => [e.id, e]));

// El cierre depende de todos los demás. Se arma solo para que sumar un encargo
// nuevo no deje la lista vieja pegada acá abajo.
ENCARGO['e-valle'].requiere = ENCARGOS.filter((e) => !e.cierre).map((e) => e.id);

// ---------------------------------------------------------------- el hilo
// Un encargo puede pedir que antes hayas cerrado otros (`requiere`). Todo lo que
// sigue es puro: recibe el progreso, no lo toca, y se prueba en Node.

const estadoDe = (p, id) => p?.encargos?.[id];

// 'hecho' · 'pedido' (te lo pidieron y lo estás haciendo) · 'disponible' (te lo
// pueden pedir) · 'trabado' (falta cerrar otro antes).
export function estadoEncargo(p, e) {
  const est = estadoDe(p, e.id);
  if (est === 'hecho' || est === 'pedido') return est;
  if (faltaCarta(p, e)) return 'trabado';
  return faltanPara(p, e).length ? 'trabado' : 'disponible';
}

// Los encargos de Ercilia esperan una carta: hasta que no la leíste, no te lo pide.
export function faltaCarta(p, e) {
  return !!e.carta && !p?.entradas?.[e.carta];
}

// Qué encargos suyos le faltan cerrar para que este se destrabe.
export function faltanPara(p, e) {
  return (e.requiere || []).filter((id) => estadoDe(p, id) !== 'hecho');
}

// Lo que corresponde hablar con este vecino: primero cobrar lo cumplido, después
// ofrecer lo primero que tenga disponible. Null si no hay nada.
export function encargoDe(p, quien) {
  const mios = ENCARGOS.filter((e) => e.quien === quien);
  const listo = mios.find((e) => estadoDe(p, e.id) === 'pedido' && e.cumplido(p));
  if (listo) return { e: listo, modo: 'listo' };
  const nuevo = mios.find((e) => estadoEncargo(p, e) === 'disponible');
  return nuevo ? { e: nuevo, modo: 'pedido' } : null;
}

export function resumenEncargos(p) {
  const cuenta = { hechos: 0, enCurso: 0, disponibles: 0, trabados: 0 };
  for (const e of ENCARGOS) {
    const est = estadoEncargo(p, e);
    if (est === 'hecho') cuenta.hechos++;
    else if (est === 'pedido') cuenta.enCurso++;
    else if (est === 'disponible') cuenta.disponibles++;
    else cuenta.trabados++;
  }
  return { ...cuenta, total: ENCARGOS.length, terminado: cuenta.hechos === ENCARGOS.length };
}

// Por qué todavía no te lo piden, en criollo y para el cuaderno.
export function pistaTrabado(p, e) {
  if (faltaCarta(p, e)) return 'Antes tiene que llegarte una carta: la trae la trochita y la guarda Ercilia.';
  const faltan = faltanPara(p, e).map((id) => ENCARGO[id]?.titulo).filter(Boolean);
  if (!faltan.length) return '';
  if (faltan.length > 2) return `Antes hay que cerrar otros ${faltan.length} encargos.`;
  const comillas = faltan.map((t) => `«${t}»`).join(' y ');
  return `Antes hay que cerrar ${comillas}.`;
}
