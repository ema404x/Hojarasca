// 2.9: la radio. Desde la estación meteorológica, o con la radio a batería que se arma
// para el refugio, se escucha a otros refugios y puestos lejanos del valle y de la
// cordillera. Una vez por día hay algo nuevo: un aviso del tiempo (que sale del mismo
// pronóstico de la estación, así que es cierto), un rumor, o un pedido. Los pedidos son
// mandados chicos: juntás lo que piden y, desde la radio, avisás que lo mandás con la
// trochita; lo que te dejan a cambio llega con el tren.
//
// Pocos mensajes y cortos: la radio es compañía, no un noticiero.
//
// Puro, sin THREE.
export const RADIO = {
  horaDesde: 7,       // antes de las siete nadie transmite
};

// Quiénes hablan. Todos inventados, todos lejos.
export const ESTACIONES_RADIO = {
  cerroNegro: 'Refugio del Cerro Negro',
  vertiente: 'Puesto La Vertiente',
  paso: 'Seccional del Paso',
  escuela: 'Escuelita de Río Chico',
  lagunaAzul: 'Refugio Laguna Azul',
};

// Los rumores: lo que se cuenta por radio en las noches largas.
export const RUMORES = [
  { id: 'r-luces', de: 'cerroNegro', texto: 'Anoche vimos luces quietas sobre la loma del Tronador. Muy quietas. No eran estrellas y no era nadie de acá. Si ven algo, avisen.' },
  { id: 'r-huemul', de: 'paso', texto: 'Los de la seccional vimos huemules bajando al mallín, una hembra con su cría. Si andan por el arroyo, pasen despacio.' },
  { id: 'r-camion', de: 'vertiente', texto: 'El camión de la leña quedó encajado en la cuesta. Hasta que no hiele no sube. Si alguien tiene tablas de más, que las guarde.' },
  { id: 'r-cancion', de: 'lagunaAzul', texto: 'Acá arriba estamos con la guitarra y el mate. Si alguien escucha, cambio: díganme qué tiempo tienen ahí abajo.' },
  { id: 'r-luces2', de: 'vertiente', texto: 'Dicen que en el cerro de enfrente hay un resplandor verde a la madrugada. Mi abuelo decía que era el pillán. Yo no digo nada.' },
  { id: 'r-condor', de: 'paso', texto: 'Pasaron tres cóndores bajito sobre el paso, uno con el anillo de los biólogos. Cambio y fuera.' },
];
// Lo que se oye en el Desafío: los otros también resisten.
export const RUMORES_DESAFIO = [
  { id: 'd-resisten', de: 'cerroNegro', texto: 'Acá seguimos. Anoche se nos subieron tres duendes al techo y los sacamos con agua hirviendo. Tapen las ventanas, cambio.' },
  { id: 'd-nave', de: 'paso', texto: 'A la madrugada se oyó crujir el monte entero del lado del paso. Dicen que el coihue grande se movió, para el lado de ustedes. Prepárense.' },
  { id: 'd-sal', de: 'lagunaAzul', texto: 'No les gusta el fuego ni el ruido. Si tienen cencerros, cuélguenlos en el cerco. Y no dejen nada chico afuera, que se lo llevan. Cambio.' },
];

// Los pedidos: se juntan con lo que hay en el valle y se mandan con la trochita.
// `pide` son materiales (troncos, tablas, piedras, lana) o cosas contadas (harina).
export const PEDIDOS_RADIO = [
  { id: 'p-techo', de: 'cerroNegro', pide: { materiales: { tabla: 8 } },
    texto: 'Se nos voló media chapa del techo con el último temporal. ¿Alguien del valle nos manda ocho tablas? Pagamos con yerba de la buena.',
    premio: { cuenta: { yerba: 3 }, texto: 'Llegaron tres cebadas de yerba del Cerro Negro' } },
  { id: 'p-lena', de: 'vertiente', pide: { materiales: { tronco: 6 } },
    texto: 'La leña se nos mojó toda. Si alguien puede mandar seis troncos, le devolvemos harina del molino del pueblo.',
    premio: { cuenta: { harina: 2 }, texto: 'Llegaron dos medidas de harina de La Vertiente' } },
  { id: 'p-pirca', de: 'paso', pide: { materiales: { piedra: 5 } },
    texto: 'Estamos levantando la pirca del corral de la seccional. Cinco piedras nos salvan la semana.',
    premio: { materiales: { tabla: 6 }, texto: 'Los de la seccional mandaron seis tablas de lenga' } },
  { id: 'p-harina', de: 'escuela', pide: { cosas: { harina: 2 } },
    texto: 'Buen día, habla la maestra de Río Chico. Para el pan de los chicos nos faltan dos medidas de harina. Si tienen molino, se agradece.',
    premio: { cuenta: { yerba: 2 }, ramitas: 6, texto: 'La escuelita mandó yerba y un atado de ramitas' } },
];
const PEDIDO = Object.fromEntries(PEDIDOS_RADIO.map((p) => [p.id, p]));
const IDS = new Set([...RUMORES, ...RUMORES_DESAFIO, ...PEDIDOS_RADIO].map((m) => m.id));

export function radioNueva() { return { dia: 0, oidos: [], pedido: null, hechos: [], ultimo: null }; }
export function sanearRadio(r) {
  const x = r && typeof r === 'object' && !Array.isArray(r) ? r : {};
  const ids = (v) => (Array.isArray(v) ? [...new Set(v.filter((k) => typeof k === 'string' && IDS.has(k)))] : []);
  const ultimo = x.ultimo && typeof x.ultimo === 'object' && typeof x.ultimo.texto === 'string' && typeof x.ultimo.de === 'string'
    ? { de: x.ultimo.de.slice(0, 60), texto: x.ultimo.texto.slice(0, 400) } : null;
  return {
    dia: Math.max(0, Math.floor(Number(x.dia) || 0)),
    oidos: ids(x.oidos),
    pedido: typeof x.pedido === 'string' && Object.hasOwn(PEDIDO, x.pedido) ? x.pedido : null,
    hechos: ids(x.hechos),
    ultimo,
  };
}

export const pedidoRadio = (id) => (typeof id === 'string' && Object.hasOwn(PEDIDO, id) ? PEDIDO[id] : null);
export const nombreEstacionRadio = (clave) => (Object.hasOwn(ESTACIONES_RADIO, clave) ? ESTACIONES_RADIO[clave] : 'Alguien, lejos');

// ¿Tenés lo que pide? `materiales` y `cosas` son los de la partida.
export function alcanzaPedido(p, materiales = {}, cosas = {}) {
  if (!p) return false;
  for (const [k, n] of Object.entries(p.pide.materiales || {})) if ((materiales[k] || 0) < n) return false;
  for (const [k, n] of Object.entries(p.pide.cosas || {})) if ((cosas[k] || 0) < n) return false;
  return true;
}
const NOMBRES = { tabla: ['tabla', 'tablas'], tronco: ['tronco', 'troncos'], piedra: ['piedra', 'piedras'], lana: ['vellón', 'vellones'], harina: ['medida de harina', 'medidas de harina'] };
export function textoPide(p) {
  const partes = [];
  for (const [k, n] of [...Object.entries(p?.pide?.materiales || {}), ...Object.entries(p?.pide?.cosas || {})]) {
    const nom = Object.hasOwn(NOMBRES, k) ? NOMBRES[k][n === 1 ? 0 : 1] : k;
    partes.push(`${n} ${nom}`);
  }
  return partes.join(' y ');
}

// Un aviso del tiempo, sacado del pronóstico (`meteo.js`): sólo si viene algo.
function avisoDelTiempo(dias, noches, desafio, dia = 0) {
  if (desafio) {
    const n = noches?.[0];
    if (n && n.tipo !== 'comun' && n.tipo !== 'calma') return { de: 'paso', texto: `Atención el valle, habla el Paso. ${n.cuando}: ${n.texto.toLowerCase()}. Cambio.` };
  }
  const d = dias?.find((x) => x.cuando !== 'Hoy' && (x.lluvia || x.viento === 'fuerte')) || dias?.find((x) => x.lluvia || x.viento === 'fuerte');
  if (!d) return null;
  const que = d.nieve ? 'nevada' : d.lluvia ? 'lluvia y tormenta' : 'viento fuerte';
  const cuando = d.cuando === 'Hoy' ? 'para hoy' : d.cuando === 'Mañana' ? 'para mañana' : 'para pasado mañana';
  // cada uno lo dice a su manera; va variando con el día
  const VOCES = [
    { de: 'lagunaAzul', texto: `Laguna Azul al valle: acá arriba ya se cerró el cerro. Anuncian ${que} ${cuando}. ${d.texto}. Guarden la leña. Cambio.` },
    { de: 'paso', texto: `Habla la seccional del Paso. El barómetro se vino abajo: ${que} ${cuando}. ${d.texto}. Aten lo que se pueda volar.` },
    { de: 'vertiente', texto: `Acá La Vertiente. Los caballos están inquietos y el cerro tiene sombrero: ${que} ${cuando}, seguro. Cambio.` },
  ];
  return VOCES[Math.abs(Math.floor(dia)) % VOCES.length];
}

// Lo que se oye al prender la radio. Devuelve { de, texto, pedido?, nuevo }.
// `ctx`: { dia, horas, pronostico: los días de `meteo.js`, noches, desafio, azar }.
// Una vez por día hay algo nuevo; si no, se repite el último (o sólo hay estática).
export function escucharRadio(r, ctx = {}) {
  const dia = Math.floor(ctx.dia || 0);
  if ((ctx.horas ?? 12) < RADIO.horaDesde) return { de: null, texto: 'Sólo estática. A esta hora no transmite nadie: probá después de las siete.', nuevo: false };
  if (r.dia === dia) return r.ultimo ? { ...r.ultimo, nuevo: false, repetido: true } : { de: null, texto: 'Estática, y un silbido lejano. Hoy ya no hay nadie en el aire.', nuevo: false };
  r.dia = dia;
  let m = null;
  // un día sí y uno no, si viene mal tiempo, lo avisan
  const tiempo = avisoDelTiempo(ctx.pronostico, ctx.noches, ctx.desafio, Math.floor(dia / 2));
  const toca = dia % 2 === 0;
  if (tiempo && (toca || ctx.desafio)) m = tiempo;
  // si no, un pedido (si no hay uno abierto y en el Relax), o un rumor
  if (!m && !ctx.desafio && !r.pedido && dia % 3 === 1) {
    const p = PEDIDOS_RADIO.find((q) => !r.hechos.includes(q.id) && !r.oidos.includes(q.id));
    if (p) { r.pedido = p.id; r.oidos.push(p.id); m = { de: p.de, texto: p.texto, pedido: p.id }; }
  }
  if (!m) {
    const lista = ctx.desafio ? RUMORES_DESAFIO : RUMORES;
    const q = lista.find((x) => !r.oidos.includes(x.id));
    if (q) { r.oidos.push(q.id); m = { de: q.de, texto: q.texto }; }
  }
  if (!m && tiempo) m = tiempo;
  if (!m) m = { de: null, texto: 'Estática. Alguien silba una chacarera muy lejos y se corta.' };
  const quien = m.de ? nombreEstacionRadio(m.de) : null;
  r.ultimo = { de: quien || 'Estática', texto: m.texto };
  return { de: quien, texto: m.texto, pedido: m.pedido || null, nuevo: true };
}

// Mandar lo del pedido: se descuenta y devuelve el premio (lo cobra main.js).
export function cumplirPedido(r, materiales, cosas) {
  const p = pedidoRadio(r?.pedido);
  if (!p || !alcanzaPedido(p, materiales, cosas)) return null;
  for (const [k, n] of Object.entries(p.pide.materiales || {})) materiales[k] -= n;
  for (const [k, n] of Object.entries(p.pide.cosas || {})) cosas[k] -= n;
  r.hechos.push(p.id);
  r.pedido = null;
  return p;
}
