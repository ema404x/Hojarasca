// El correo: cartas que llegan con la trochita y que Ercilia guarda en el almacén.
// El cuaderno ya contaba que el almacén de ramos generales "hacía de correo y de
// banco"; ahora hace de correo. La trochita para en la Estación del Valle aunque vos
// estés en la otra punta del valle, y si hay carta, llega. Como mucho una por día.
//
// Algunas cartas abren los encargos de Ercilia —la única vecina que no pedía nada—,
// y esos encargos piden lo que sale de la huerta y de la majada.
//
// Módulo puro (se prueba en Node). Una carta leída es una entrada del cuaderno: no
// hay un "leídas" aparte que se pueda desincronizar.

// `desde`: el primer día en que puede llegar. `llega(p)`: si ya tiene sentido que llegue.
export const CARTAS = [
  {
    id: 'c-casa', de: 'Tu hermana, desde Buenos Aires', desde: 2,
    llega: () => true,
    texto: [
      'Querido: te escribo al almacén porque la señora del teléfono me dijo que ahí llega todo. Acá seguimos igual, con el calor y el ruido. Mamá pregunta si comés.',
      'Contame cómo es eso. Me imagino un bosque de postal y seguro que no es así. Mandá una carta de vuelta, aunque sea corta, que el correo tarda pero llega.',
    ],
  },
  {
    id: 'c-esquel', de: 'Rosa, la hermana de Ercilia, desde Esquel', desde: 3,
    // llega cuando ya tenés dónde sembrar: antes no tendría a quién pedirle
    llega: (p) => (p.obras || []).some((o) => o.plano === 'cantero' && o.etapas >= 1),
    texto: [
      'Ercilia: me dijeron que hay alguien nuevo en el valle que tiene huerta. Acá en el pueblo la verdura llega cara y tarde, en el camión del martes, y medio machucada.',
      'Si tu vecino tiene habas y papas de sobra, mandame con el tren, que yo le pago en semilla buena de la que me trae el ingeniero agrónomo. Un abrazo grande, Rosa.',
    ],
  },
  {
    id: 'c-tejedora', de: 'Doña Amalia, tejedora de Ingeniero Jacobacci', desde: 4,
    // llega cuando ya viste la majada del galpón
    llega: (p) => !!p.entradas?.oveja,
    texto: [
      'Señora Ercilia: soy Amalia, la del telar, la que le vendió las mantas grises. Este año la esquila vino floja y no tengo lana para los pedidos del invierno.',
      'Me contaron que en el galpón del valle hay majada otra vez. Si alguien me junta unos vellones, se los pago con lo que tenga. La lana del sur es la mejor que hay, no se lo digo por decir.',
    ],
  },
  {
    id: 'c-ramal', de: 'La administración del ramal', desde: 3,
    // llega cuando diste la vuelta entera en la trochita
    llega: (p) => (p.vueltas || 0) >= 1,
    texto: [
      'Estimado pasajero: la guarda nos informa que usted completó la vuelta entera del ramal. Le hacemos llegar nuestro agradecimiento por usar el servicio.',
      'Le recordamos que la trocha de 75 centímetros es la misma de La Trochita que une Ingeniero Jacobacci con Esquel desde 1945, con locomotoras Baldwin y Henschel de 1922. Cuídela, que no se fabrica más.',
    ],
  },
  {
    id: 'c-naturalista', de: 'Un naturalista de Bariloche', desde: 5,
    // llega cuando tu cuaderno ya es un cuaderno
    llega: (p) => Object.keys(p.entradas || {}).length >= 25,
    texto: [
      'Estimado: Ema, la guardaparque, me pasó su dirección. Me cuenta que lleva un cuaderno de campo con más de veinte anotaciones, y que las hace bien.',
      'Le pido un favor: si ve bandurrias, anote la hora y el lugar. Las estamos contando en toda la cordillera y cada dato sirve. Lo que se anota con cuidado no se pierde nunca.',
    ],
  },
  {
    id: 'c-vuelta', de: 'Tu hermana, desde Buenos Aires', desde: 8,
    // la última: cuando cerraste la tanda de encargos
    llega: (p) => p.encargos?.['e-valle'] === 'hecho',
    texto: [
      'Recibí tu carta. La leí tres veces y después se la leí a mamá, que lloró un poco y dijo que se te nota contento.',
      'No te voy a preguntar cuándo volvés. Ya entendí que no es esa la pregunta. Mandá una foto del lago, que la quiero poner en la heladera.',
    ],
    // 1.11: la foto que pedía, ahora se puede mandar
    foto: 'f-atardecer',
    gracias: 'Una foto del lago para tu hermana. Va a quedar linda en la heladera. El flete lo pago yo, no me discutas.',
  },
  // 1.11: pedidos de fotos. Llegan como cualquier carta; lo que piden es uno de los
  // desafíos del álbum. Sacás la foto, se la das a Ercilia y ella te paga lo que dejaron.
  {
    id: 'c-revista', de: 'La revista Patagonia Viva, desde Buenos Aires', desde: 6,
    llega: (p) => Object.keys(p.desafios || {}).length >= 3,
    texto: [
      'Estimado lector: nos llegó el dato de que en su valle todavía se ven huemules. Estamos armando un número especial sobre el ciervo del sur, que está en peligro y que casi nadie ha visto.',
      'Si consigue una foto de un huemul con la luz baja de la mañana o de la tarde, mándela con el tren. Dejamos pagado el flete y un pequeño honorario en el almacén.',
    ],
    foto: 'f-huemul', premio: { cuenta: { yerba: 16 } },
    gracias: 'La revista dejó pagado en yerba: dos kilos. Tomá, que es tuyo.',
  },
  {
    id: 'c-almanaque', de: 'La administración del ramal', desde: 7,
    llega: (p) => !!p.entradas?.['c-ramal'],
    texto: [
      'Estimado pasajero: estamos preparando el almanaque del ramal para el año que viene, con fotos sacadas por los propios pasajeros.',
      'Si nos manda una foto de la trochita en marcha, echando humo, la publicamos con su nombre. En agradecimiento le dejamos unos durmientes viejos en el almacén: buena madera, de la que ya no hay.',
    ],
    foto: 'f-tren', premio: { materiales: { tabla: 10 } },
    gracias: 'Los del ramal dejaron diez tablas de durmiente. Llevátelas, que me ocupan medio depósito.',
  },
  {
    id: 'c-amalia', de: 'Doña Amalia, tejedora de Ingeniero Jacobacci', desde: 8,
    llega: (p) => !!p.entradas?.['e-lana'],
    texto: [
      'Señora Ercilia: la lana que me mandaron del valle salió hermosa. Tejí tres mantas y ya me las encargaron todas.',
      'Le pido una cosa más, de vieja curiosa: una foto del galpón donde esquilaron, con el molino. Mi padre trabajó en uno igual y quiero ver si se parece. Para el que la saque, le mando un poncho de mi telar.',
    ],
    foto: 'f-galpon', premio: { cuenta: { poncho: 1 } },
    gracias: 'Amalia te mandó un poncho de su telar. Mirá la guarda: es de Jacobacci, se nota enseguida.',
  },
  {
    id: 'c-condores', de: 'Un naturalista de Bariloche', desde: 9,
    llega: (p) => !!p.entradas?.['c-naturalista'] && !!p.entradas?.condor,
    texto: [
      'Estimado: ahora estamos contando cóndores en los dormideros de la cordillera, y necesitamos fotos de ejemplares en vuelo para reconocerlos por las plumas de las alas.',
      'Si puede fotografiar uno planeando, mándela. Por el trabajo le dejo en el almacén unas papas andinas para semilla, de las que guardamos en el banco de semillas.',
    ],
    foto: 'f-condor', premio: { cuenta: { 'semillas-papa': 4 } },
    gracias: 'El naturalista dejó papas para semilla, de las andinas. Dice que se dan mejor en tierra fría.',
  },
];
export const CARTA = Object.fromEntries(CARTAS.map((c) => [c.id, c]));

export function correoNuevo() {
  return { llegadas: {}, ultimoDia: -1, fotos: {} };
}
export function sanearCorreo(v) {
  const base = correoNuevo();
  if (!v || typeof v !== 'object' || Array.isArray(v)) return base;
  for (const [id, dia] of Object.entries(v.llegadas || {})) {
    // 2.6.1: Object.hasOwn: un id heredado ("constructor") no es una carta
    if (Object.hasOwn(CARTA, id) && Number.isFinite(Number(dia))) base.llegadas[id] = Math.floor(Number(dia));
  }
  base.ultimoDia = Number.isFinite(Number(v.ultimoDia)) ? Math.floor(Number(v.ultimoDia)) : -1;
  for (const [id, f] of Object.entries(v.fotos || {})) {
    if (Object.hasOwn(CARTA, id) && CARTA[id].foto && f && typeof f === 'object') base.fotos[id] = { dia: Math.floor(Number(f.dia) || 0), enviada: !!f.enviada };
  }
  return base;
}

// ¿Llega una carta hoy? La trochita paró en la Estación del Valle. Devuelve la carta
// que llega (y la anota como llegada) o null. Una por día, en el orden de la lista.
export function repartir(correo, p, dia) {
  if (correo.ultimoDia === dia) return null;
  for (const c of CARTAS) {
    if (correo.llegadas[c.id] !== undefined) continue;
    if (dia < c.desde) continue;
    if (!c.llega(p)) continue;
    correo.llegadas[c.id] = dia;
    correo.ultimoDia = dia;
    return c;
  }
  return null;
}

// Las que llegaron y todavía no te dio Ercilia (no están en el cuaderno).
export function porRetirar(correo, p) {
  return CARTAS.filter((c) => correo.llegadas[c.id] !== undefined && !p.entradas?.[c.id]);
}
export function cartasLeidas(p) {
  return CARTAS.filter((c) => p.entradas?.[c.id]).length;
}

// ---------------------------------------------------------------- pedidos de fotos (1.11)
export const dePara = (c) => `${c.de.charAt(0).toLowerCase()}${c.de.slice(1)}`;
export const PEDIDOS = CARTAS.filter((c) => c.foto);
// Los que ya leíste y todavía no tienen su foto.
export function pedidosAbiertos(correo, p) {
  return PEDIDOS.filter((c) => p.entradas?.[c.id] && !correo.fotos?.[c.id]);
}
// Sacaste una foto: `vistos` son los desafíos que se ven en ella (hechos antes o no).
// Guarda la foto para cada pedido abierto que la pide; devuelve esos pedidos.
export function fotoParaPedidos(correo, p, vistos, dia) {
  if (!correo.fotos) correo.fotos = {};
  const sirve = pedidosAbiertos(correo, p).filter((c) => vistos.includes(c.foto));
  for (const c of sirve) correo.fotos[c.id] = { dia, enviada: false };
  return sirve;
}
// Fotos sacadas que todavía no le diste a Ercilia.
export function porEnviar(correo) {
  return PEDIDOS.filter((c) => correo.fotos?.[c.id] && !correo.fotos[c.id].enviada);
}
export function enviarFoto(correo, id) {
  const f = correo.fotos?.[id];
  if (!f || f.enviada) return false;
  f.enviada = true;
  return true;
}
export function partesDeEnvio(c) {
  return [`¿Es la foto para ${dePara(c)}? Dámela, que sale mañana con el tren.`, c.gracias];
}

// Cómo te la da Ercilia: primero ella, después la carta.
export function partesDeCarta(c) {
  return [`Llegó carta para vos con el tren. Es de ${c.de.charAt(0).toLowerCase()}${c.de.slice(1)}. Tomá, leela tranquilo.`, ...c.texto];
}
