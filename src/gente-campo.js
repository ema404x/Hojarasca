// 4.6: la gente fuera del pueblo (paquete 1a del mapa, ver PLAN_MAPA_VALOR.md, «Decisiones tras la auditoría»).
// Hoy el valle tiene gente con historias pero sin economía: Nicanor (la Cabaña del Pescador) y Josefina (el mirador) no
// piden, no pagan ni venden, y la estepa, la cantera y el oeste están vacíos. Acá:
//   · tres personas nuevas, pocas y con historia corta: Fermín, el pastor del galpón de esquila (lana y cuero de la majada);
//     Belisario, el arriero del puesto del paso (va y viene por el oeste, con yerba y sal, y compra piñones); y Tobías, el
//     cantero de la cantera del suroeste (vende el pico de cantero y la piedra);
//   · pedidos propios (2 o 3 por persona, con su voz) para los cinco: uno por vez, que cambia cada dos días; cuentan en el
//     mismo tope de 2 entregas por día que los pedidos de los vecinos de la aldea (pedidos.js), así no se suma plata de más;
//   · una tiendita para los cinco, con lo de cada uno y un poco por día.
// Módulo puro (sin three ni DOM; se prueba en Node). Sólo en el Relax. Las herramientas de zona (hoz, pala de arcilla,
// esquiladora, pico de cantero) las define el agente «recursos»: acá se venden por su id con `darHerramienta` (ver
// gente-campo-juego.js y CAMBIOS_4_6_GENTE.md); los materiales nuevos (junco, hierbas, arcilla, cuero, piedra-cantera), como
// texto, protegidos con `existe`.
import { valorUnidad, dondeDe, cuantoDe, tablonNuevo, sanearTablon } from './tablon.js';
import { PEDIDOS } from './pedidos.js';
import { negociosDe } from './negocios.js';
import { hashTexto } from './comercio.js';
import { HERRAMIENTAS_ZONA } from './recursos-zona.js';

// ---------------------------------------------------------------- dónde está cada uno
// Coordenadas fijas (las de la auditoría, AUDITORIA_MAPA_VALOR.md 4.2 y 4.3). El galpón se sortea según la calidad: Fermín
// va al que haya (T.lugares.galpon) y éste es el respaldo. El puesto B lo arma el agente «puestos»: cuando exporte su punto
// (PUESTOS_RUTA.B.pos o parecido), cambiar PUESTO_PASO por ése (anotado en CAMBIOS_4_6_GENTE.md).
export const GALPON_RESPALDO = { x: 228, z: -110 };
export const PUESTO_PASO = { x: -340, z: -20 };      // el puesto B (−350, −20), corrido 10 m al este de la vía como dice el plan
export const PUESTO_CANTERA = { x: -320, z: -288 };  // el puesto A
export const CANTERA = { x: -405, z: -305 };         // la veta (la arma el agente «recursos»)

// ---------------------------------------------------------------- las personas nuevas
// `lugar`: dónde vive (para gente-campo-mundo.js). `saludos`: por la hora. Los colores van en gente-ropa.js (ASPECTO).
export const PERSONAS_CAMPO = {
  fermin: {
    nombre: 'Fermín', completo: 'Fermín Catrileo', oficio: 'pastor', lugar: 'galpon',
    saludos: {
      madrugada: 'Temprano. Las ovejas ya están despiertas, así que yo también.',
      manana: 'Buen día. Pasá, pero despacito, que la majada se espanta.',
      tarde: 'Buenas. A esta hora las junto para que no se me desparramen por la estepa.',
      noche: 'Ya es tarde para andar por la estepa. ¿Tenés dónde dormir?',
      lluvia: 'Con agua no se esquila: la lana mojada se pudre. Hoy es día de mate.',
    },
    despedida: 'Andá tranquilo. Y si ves una oveja suelta, no la corras: avisame.',
  },
  belisario: {
    nombre: 'Belisario', completo: 'Belisario Paredes', oficio: 'arriero', lugar: 'paso',
    saludos: {
      madrugada: '¡Epa! Madrugador. Yo ya tengo dos leguas encima.',
      manana: '¡Buenas, buenas! Belisario, para servirle. ¿Anda de paso o se queda?',
      tarde: 'Buenas tardes. Voy y vengo como el viento, pero para usted tengo un rato.',
      noche: 'A esta hora el arriero ya desensilló. Pero charlar, se charla.',
      lluvia: 'Con esta agua los caminos se ponen jabonosos. Mejor quietos.',
    },
    despedida: '¡Que le vaya lindo! Y si cruza el paso, avise en el puesto.',
  },
  tobias: {
    nombre: 'Tobías', completo: 'Tobías Hughes', oficio: 'cantero', lugar: 'cantera',
    saludos: {
      madrugada: 'Buen día. La piedra se trabaja mejor fresca, antes de que pegue el sol.',
      manana: 'Buen día. Cuidado dónde pisás, que acá todo lo suelto rueda.',
      tarde: 'Buenas. Ya va siendo hora de dejar la maceta.',
      noche: 'De noche no se pica. Se escucha cómo se enfría la ladera.',
      lluvia: 'Con lluvia la piedra resbala. Hoy afilo y ordeno las cuñas.',
    },
    despedida: 'Que te vaya bien. Y si necesitás piedra buena, ya sabés dónde estoy.',
  },
};
export const CLAVES_CAMPO = Object.keys(PERSONAS_CAMPO);
// Los del valle que ya existían (gente.js) y ahora también piden y venden
export const VALLE_CON_TRATO = ['nicanor', 'ema'];
export const esPersonaCampo = (k) => typeof k === 'string' && Object.hasOwn(PERSONAS_CAMPO, k);
export const tieneTrato = (k) => esPersonaCampo(k) || VALLE_CON_TRATO.includes(k);
export function saludoCampo(k, hora = 10, lluvia = 0) {
  const p = esPersonaCampo(k) ? PERSONAS_CAMPO[k] : null;
  if (!p) return null;
  if (lluvia > 0.5) return p.saludos.lluvia;
  const h = Number(hora) || 0;
  return h < 7 ? p.saludos.madrugada : h < 12 ? p.saludos.manana : h < 19.5 ? p.saludos.tarde : p.saludos.noche;
}

// Sus historias (cortas: tres renglones cada una). Se cuentan una por charla, en orden; quedan anotadas en
// progreso.genteCampo.historias (no van al cuaderno: el cuaderno es de lo de siempre).
export const HISTORIAS_CAMPO = {
  fermin: [
    { id: 'fermin-medias', titulo: 'Las ovejas a medias',
      partes: [
        'Las ovejas son de Don Ramón. Yo se las cuido a medias: la mitad de los corderos que nacen son míos.',
        'Así empezó mi abuelo, con un patrón en Chubut. Así empecé yo. Un día voy a tener majada propia.',
        'Ramón dice que ya la tengo, que lo que falta es el papel. Ramón es así: te regala las cosas diciéndote que ya eran tuyas.',
      ] },
    { id: 'fermin-viento', titulo: 'Contar con el viento',
      partes: [
        'Mi abuela contaba las ovejas sin mirarlas. Escuchaba el viento y sabía si faltaba una.',
        'Yo no llego a tanto. Pero de noche, si el perro de la estepa ladra dos veces seguidas, me levanto.',
        'La estepa parece vacía porque es grande. Vacía no está nunca.',
      ] },
  ],
  belisario: [
    { id: 'belisario-paso', titulo: 'El paso de las mulas',
      partes: [
        'Por el oeste, pasando el puesto, hay una huella vieja que cruza para el otro lado. Por ahí pasaban las tropas de mulas.',
        'Mi padre llevaba vacas a Chile en el verano y volvía con sal, yerba y unas botas que no se gastaban nunca.',
        'Ahora llevo menos y vuelvo con más charla. Uno se acostumbra a que el camino le cuente cosas.',
      ] },
    { id: 'belisario-ramon', titulo: 'Don Ramón y el zaino',
      partes: [
        'Con Ramón nos conocemos de pibes. Él se quedó arriba; yo me fui a andar.',
        'El zaino que te presta es hijo de una yegua que le vendí yo. Le dije que era mansa y casi lo mata.',
        'Todavía me lo cobra. Cada vez que paso por el puesto me sirve el mate más frío.',
      ] },
  ],
  tobias: [
    { id: 'tobias-gales', titulo: 'Picapedreros de Gales',
      partes: [
        'Mi bisabuelo vino de Gales con un martillo, tres cuñas y la Biblia de la familia. La Biblia se perdió; las cuñas, no.',
        'En el valle del Chubut levantaron capillas, molinos y puentes con la piedra de las bardas. Yo aprendí con mi tío, a los doce.',
        'Acá la piedra es otra: más dura, más fría. Pero una veta es una veta. Hay que escucharla antes de pegarle.',
      ] },
    { id: 'tobias-veta', titulo: 'La veta que vuelve',
      partes: [
        'La gente cree que una cantera se termina. Una buena, no: el agua, el hielo y el tiempo la van abriendo.',
        'Cada invierno la ladera me deja algo nuevo, suelto, listo para sacar. Uno vuelve y la piedra está.',
        'Por eso no la vuelo con pólvora. Pico de cantero, cuña y paciencia. La montaña te da lo que puede, no lo que querés.',
      ] },
  ],
};

// ---------------------------------------------------------------- los pedidos
// Uno a la vez por persona, que cambia cada `dias`. Pagan `n × valor × base` (un poco más que un pedido de la aldea: están
// lejos), redondo a $50. Cuentan en el tope de PEDIDOS.porDia de los vecinos (negocios.hoy.pedidos).
export const PEDIDOS_CAMPO = { dias: 2, base: 1.25 };
export const LISTA_PEDIDOS = {
  nicanor: [
    { id: 'nicanor-pan', k: 'pan-casero', n: 3, pide: 'Me quedé sin pan. Acá el pan no llega: si me traés tres panes caseros de la aldea, te los pago bien.', gracias: 'Pan del día. Esta noche como como un rey, mirando el agua.' },
    { id: 'nicanor-yerba', k: 'yerba', n: 4, pide: 'Se me está terminando la yerba, y sin mate no pica nada. Cuatro medidas me alcanzan para la semana.', gracias: 'Ahora sí. Sentate que la estreno.' },
    { id: 'nicanor-troncos', k: 'tronco', n: 4, pide: 'La estufa de la cabaña come leña como un chancho. Cuatro troncos y paso el frío tranquilo.', gracias: 'Lindos troncos. Con esto aguanto hasta que baje el viento.' },
  ],
  ema: [
    { id: 'ema-tablas', k: 'tabla', n: 4, pide: 'La baranda del mirador tiene dos tablas flojas. Si me traés cuatro, la arreglo antes de que alguien se apoye mal.', gracias: 'Perfecto. Mañana la baranda queda firme. Gracias por cuidar el mirador.' },
    { id: 'ema-empanadas', k: 'empanadas', n: 4, pide: 'Mañana hago el recorrido largo, hasta el borde del bosque. Cuatro empanadas y no vuelvo a almorzar.', gracias: 'Me salvaste el día. Te cuento a la vuelta qué vi.' },
    { id: 'ema-miel', k: 'miel', n: 1, pide: 'El viento del mirador me deja la garganta a la miseria. Un frasco de miel, si podés.', gracias: 'Miel del valle. Con limón y un té, mañana estoy nueva.' },
  ],
  fermin: [
    { id: 'fermin-harina', k: 'harina', n: 4, pide: 'Si subís de la aldea, traeme cuatro medidas de harina. Tortas fritas con este frío, eso pido.', gracias: 'Esta tarde hay tortas fritas. Si pasás, hay para vos.' },
    { id: 'fermin-yerba', k: 'yerba', n: 4, pide: 'El pastor sin yerba es un hombre perdido. Cuatro medidas, y te pago lo que vale el viaje.', gracias: 'Gracias. Ahora sí, la majada y yo estamos completos.' },
    { id: 'fermin-pan', k: 'pan-casero', n: 3, pide: 'Hace una semana que como galleta dura. Tres panes caseros de la panadería, si podés.', gracias: 'Pan de verdad. Mirá cómo se me alegra la cara.' },
  ],
  belisario: [
    { id: 'belisario-pinones', k: 'pinon', n: 6, pide: 'Del otro lado del paso me pagan bien los piñones. Seis, y te doy lo justo y un poco más.', gracias: 'Lindos piñones, gordos. Del pehuenal del mirador, ¿no? Se nota.' },
    { id: 'belisario-empanadas', k: 'empanadas', n: 4, pide: 'Mañana salgo con la tropilla y no paro hasta la noche. Cuatro empanadas para el camino.', gracias: '¡Eso! Con esto llego a donde sea.' },
    { id: 'belisario-ahumada', k: 'trucha-ahumada', n: 1, pide: 'Me encargaron una trucha ahumada del lago para llevar al otro lado. Una sola, pero buena.', gracias: 'Ésta va a hacer feliz a más de uno. Gracias.' },
  ],
  tobias: [
    { id: 'tobias-pan', k: 'pan-casero', n: 3, pide: 'Acá arriba uno se olvida de comer hasta que le tiemblan las manos. Tres panes caseros, si bajás a la aldea.', gracias: 'Diolch. Gracias, quiero decir. Mi abuela decía las dos.' },
    { id: 'tobias-empanadas', k: 'empanadas', n: 4, pide: 'Cuatro empanadas y no bajo en todo el día. La veta no espera.', gracias: 'Así se trabaja. Con la panza llena la maceta pesa menos.' },
    { id: 'tobias-troncos', k: 'tronco', n: 4, pide: 'Necesito cuatro troncos para los rodillos: las piedras grandes se mueven rodando, no a lomo.', gracias: 'Buenos troncos, derechos. Con esto bajo las grandes hasta el puesto.' },
  ],
};
// Lo que vale una unidad para el pedido (la yerba no es un bien del mercado: $100, lo de economia.js)
const valorPedido = (k) => (k === 'yerba' ? 100 : valorUnidad(k));
export const ventanaCampo = (dia) => Math.floor((Math.max(1, Math.floor(Number(dia) || 1)) - 1) / PEDIDOS_CAMPO.dias);
export function pagoPedido(k, n) { return Math.max(100, Math.round((n * valorPedido(k) * PEDIDOS_CAMPO.base) / 50) * 50); }
// El pedido de hoy de esta persona (o null si no pide o ya se lo entregaste en esta ventana). `existe(k)`: si el juego conoce
// la cosa.
export function pedidoCampo(gc, k, dia, existe = () => true) {
  if (!Object.hasOwn(LISTA_PEDIDOS, k)) return null;
  const v = ventanaCampo(dia);
  if (gc?.pedidos?.[k] === v) return null;
  const lista = LISTA_PEDIDOS[k].filter((x) => existe(x.k));
  if (!lista.length) return null;
  const x = lista[hashTexto(`campo|${k}|${v}`) % lista.length];
  const hasta = (v + 1) * PEDIDOS_CAMPO.dias;
  return { ...x, donde: dondeDe(x.k), pago: pagoPedido(x.k, x.n), hasta, ventana: v };
}
// Cuántos pedidos (de la aldea y del campo) llevás hoy: el mismo tope de pedidos.js
export function pedidosDeHoy(p, dia) { const h = negociosDe(p)?.hoy; return h && h.dia === dia ? h.pedidos || 0 : 0; }
// ¿Se puede entregar? `tengo(donde, k)`. { ok, pedido } o { ok: false, motivo: 'no pide' | 'falta' | 'cupo', pedido }
export function puedeEntregarCampo(p, gc, k, dia, tengo, existe) {
  const pedido = pedidoCampo(gc, k, dia, existe);
  if (!pedido) return { ok: false, motivo: 'no pide' };
  if (pedidosDeHoy(p, dia) >= PEDIDOS.porDia) return { ok: false, motivo: 'cupo', pedido };
  if ((Number(tengo(pedido.donde, pedido.k)) || 0) < pedido.n) return { ok: false, motivo: 'falta', pedido };
  return { ok: true, pedido };
}
// Lo anota (en el estado propio y en el tope de los vecinos). Cobrar y descontar lo hace quien llama (gente-campo-juego.js).
export function anotarEntregaCampo(p, gc, k, dia, pedido) {
  gc.pedidos[k] = pedido.ventana;
  gc.entregados = (gc.entregados || 0) + 1;
  const n = negociosDe(p);
  if (n) { n.hoy = n.hoy?.dia === dia ? n.hoy : { dia, jornales: 0, pedidos: 0 }; n.hoy.pedidos = (n.hoy.pedidos || 0) + 1; }
}

// ---------------------------------------------------------------- las tienditas
// Cada cosa: { id, titulo, tipo ('material' | 'entrada' | 'cosa' | 'herramienta' | 'dato'), k, n (lo que te llevás), precio,
// porDia (cuántas veces por día), una (se compra una vez: lo que no se gasta), requiere ({ oficio, nivel }), dice (lo que
// contesta al vendértelo) }. Los precios: ~1,35 veces lo que vale (por encima de lo que paga cualquier puesto del tren, así no
// se compra acá para revender; ver CAMBIOS_4_6_GENTE.md).
// Las herramientas de zona: el id con que las define el agente «recursos» (ajustar al juntar si cambia).
// 4.6 (junta): los ids, el nombre, el precio y el requisito son los de HERRAMIENTAS_ZONA (recursos-zona.js): una sola fuente.
export const HERRAMIENTAS_CAMPO = { hoz: 'hoz-junco', pala: 'pala-arcilla', esquiladora: 'cuchillo-cuero', pico: 'pico-cantero' };
const hz = (k) => HERRAMIENTAS_ZONA[HERRAMIENTAS_CAMPO[k]];
export const TIENDAS = {
  nicanor: [
    { id: 'mosca', titulo: 'Carnada y una mosca atada por él', tipo: 'cosa', k: 'mosca', n: 1, precio: 700, una: true, dice: 'Pluma de cachaña y un poco de lana. Con ésta pican el doble de rápido. La carnada te la regalo.' },
    { id: 'truchas', titulo: 'Dos truchas frescas', tipo: 'entrada', k: 'trucha-fresca', n: 2, precio: 750, porDia: 2, dice: 'Sacadas esta mañana. Mirales el ojo: brillante, como tiene que ser.' },
    { id: 'ahumada', titulo: 'Una trucha ahumada', tipo: 'entrada', k: 'trucha-ahumada', n: 1, precio: 900, porDia: 1, dice: 'Ahumada con leña de ñire, dos días. No la apures.' },
    { id: 'botas', titulo: 'Botas de goma de pescador', tipo: 'cosa', k: 'botas', n: 1, precio: 1200, una: true, dice: 'Unas que me quedan chicas. Con éstas cruzás el agua sin que te oigan los bichos.' },
    { id: 'pala', titulo: hz('pala').nombre, tipo: 'herramienta', k: HERRAMIENTAS_CAMPO.pala, n: 1, precio: hz('pala').precio, una: true, dice: 'Para el barro de la desembocadura, donde el arroyo llega al lago. Angosta y filosa: corta el terrón sin desarmarlo.' },
  ],
  ema: [
    { id: 'habas', titulo: 'Semillas de habas', tipo: 'cosa', k: 'semillas-habas', n: 3, precio: 400, porDia: 2, dice: 'Del vivero de la seccional. Tres siembras: en cinco días, habas.' },
    { id: 'papa', titulo: 'Papa para semilla', tipo: 'cosa', k: 'semillas-papa', n: 2, precio: 450, porDia: 2, dice: 'Papa andina, de las que aguantan la helada. Tarda, pero rinde.' },
    { id: 'dato', titulo: 'Un dato del valle', tipo: 'dato', k: 'dato', n: 1, precio: 150, porDia: 1, dice: '' },
    { id: 'hoz', titulo: hz('hoz').nombre, tipo: 'herramienta', k: HERRAMIENTAS_CAMPO.hoz, n: 1, precio: hz('hoz').precio, una: true, dice: 'Para el junco y las hierbas del mallín. Cortá de a poco y desde arriba: la mata vuelve.' },
  ],
  fermin: [
    { id: 'lana', titulo: 'Dos vellones de lana', tipo: 'material', k: 'lana', n: 2, precio: 850, porDia: 3, dice: 'De la esquila de la primavera. Lavada en el arroyo, sin abrojos.' },
    { id: 'cuero', titulo: 'Un cuero de oveja', tipo: 'material', k: 'cuero', n: 1, precio: 750, porDia: 2, dice: 'De la que se nos murió de vieja en el invierno. No se caza nada: la majada da lo que da.' },
    { id: 'tijera', titulo: 'Tijera de esquilar', tipo: 'cosa', k: 'tijera', n: 1, precio: 600, una: true, dice: 'La de repuesto. Afilada por mí: con ésta las ovejas ni se enteran.' },
    { id: 'esquiladora', titulo: hz('esquiladora').nombre, tipo: 'herramienta', k: HERRAMIENTAS_CAMPO.esquiladora, n: 1, precio: hz('esquiladora').precio, una: true, dice: 'Hoja ancha y vaina de suela, como el mío. Para cuerear y cortar tientos.' },
  ],
  belisario: [
    { id: 'yerba', titulo: 'Cuatro medidas de yerba', tipo: 'cosa', k: 'yerba', n: 4, precio: 500, porDia: 2, dice: 'Yerba con palo, de la que se toma del otro lado. Fuerte.' },
    { id: 'sal', titulo: 'Sal gruesa', tipo: 'cosa', k: 'sal', n: 6, precio: 400, porDia: 2, dice: 'De las salinas, traída a lomo de mula. Para el asado, la mejor.' },
    { id: 'maiz', titulo: 'Maíz blanco pisado', tipo: 'cosa', k: 'maiz', n: 4, precio: 450, porDia: 1, dice: 'Para un locro de los de antes. Remojalo la noche anterior.' },
  ],
  tobias: [
    { id: 'piedra', titulo: 'Cuatro piedras', tipo: 'material', k: 'piedra', n: 4, precio: 600, porDia: 3, dice: 'Sueltas, de la ladera. Para una pirca o un fogón, sobran.' },
    { id: 'piedra-cantera', titulo: 'Dos piedras de cantera', tipo: 'material', k: 'piedra-cantera', n: 2, precio: 650, porDia: 2, dice: 'Labradas a escuadra. Éstas son para las obras que tienen que durar.' },
    { id: 'pico', titulo: hz('pico').nombre, tipo: 'herramienta', k: HERRAMIENTAS_CAMPO.pico, n: 1, precio: hz('pico').precio, una: true, requiere: hz('pico').requisito, dice: 'El único que entra en la veta. Cuidalo: la punta se templa una vez y dura toda la vida.' },
  ],
};
// Los datos que vende Josefina: de a uno por día, en orden (y vuelve a empezar)
export const DATOS_VALLE = [
  'La veta buena de piedra está al pie de la montaña del suroeste, pasando el puesto de la cantera. Tobías la trabaja con un pico de cantero, y te lo vende si ya sabés picar.',
  'El junco y las hierbas salen en el mallín, junto al puente de troncos. Con una hoz y cortando de a poco, vuelven solos.',
  'Donde el arroyo llega al lago, frente al salto, hay arcilla. Se llega a pie desde el molino o en kayak desde el muelle.',
  'Fermín, el pastor, está en el galpón de esquila con la majada de Don Ramón. Vende lana y cuero, y paga bien la harina.',
  'Belisario, el arriero, para en el puesto del paso, al oeste, entre la parada del mallín y el mirador. Anda con yerba y sal, y compra piñones.',
  'Los pehuenes de este mirador dan piñones en otoño. Juntá los que caen: el árbol no se toca.',
  'El tablón de la plaza paga más cuanto más lejos queda lo que piden: lo del arrayanal y el Puesto Alto, más que nada.',
];
// Lo que hay para comprarle hoy: [{ ...cosa, quedan, puede, motivo }]. `ctx`: existe(k), tiene(k) (si ya tenés esa cosa o
// herramienta), nivel(oficio).
export function tiendaDe(gc, k, dia, ctx = {}) {
  if (!Object.hasOwn(TIENDAS, k)) return [];
  const existe = ctx.existe || (() => true), tiene = ctx.tiene || (() => false), nivel = ctx.nivel || (() => 0);
  const hoy = gc?.tienda?.dia === dia ? gc.tienda.compras : {};
  const out = [];
  for (const c of TIENDAS[k]) {
    if (c.tipo !== 'herramienta' && c.tipo !== 'dato' && !existe(c.k)) continue;   // (los materiales nuevos, recién al juntar)
    if (c.una && tiene(c.k)) continue;
    const quedan = c.una ? 1 : Math.max(0, (c.porDia || 1) - (hoy[`${k}|${c.id}`] || 0));
    let motivo = quedan <= 0 ? 'Por hoy no queda' : null;
    if (!motivo && c.requiere && nivel(c.requiere.oficio) < c.requiere.nivel) motivo = `Pide ${c.requiere.oficio} nivel ${c.requiere.nivel}`;
    out.push({ ...c, quedan, puede: !motivo, motivo });
  }
  return out;
}
// Anota una compra (el pago y lo que te llevás los hace quien llama)
export function anotarCompra(gc, k, id, dia) {
  if (!gc.tienda || gc.tienda.dia !== dia) gc.tienda = { dia, compras: {} };
  const clave = `${k}|${id}`;
  gc.tienda.compras[clave] = (gc.tienda.compras[clave] || 0) + 1;
}
// El dato de hoy (y lo avanza)
export function datoDelValle(gc) {
  const i = (gc.datos || 0) % DATOS_VALLE.length;
  gc.datos = (gc.datos || 0) + 1;
  return DATOS_VALLE[i];
}
// La historia que todavía no te contó (o null)
export function historiaPendiente(gc, k) {
  const lista = Object.hasOwn(HISTORIAS_CAMPO, k) ? HISTORIAS_CAMPO[k] : [];
  const i = gc?.historias?.[k] || 0;
  return i < lista.length ? lista[i] : null;
}

// ---------------------------------------------------------------- el estado (progreso.genteCampo)
//   tablon      el tablón de la plaza (tablon.js)
//   pedidos     { persona: ventana }: la última ventana en que le entregaste el pedido
//   entregados  cuántos pedidos del campo entregaste en toda la partida
//   tienda      { dia, compras: { 'persona|cosa': veces } }: lo comprado hoy
//   historias   { persona: cuántas te contó }
//   datos       cuántos datos del valle te vendió Josefina
//   conocidos   { persona: día }: el día que la conociste (para el diario)
export const genteCampoNueva = () => ({ tablon: tablonNuevo(), pedidos: {}, entregados: 0, tienda: { dia: 0, compras: {} }, historias: {}, datos: 0, conocidos: {} });
const entero = (v, max = 1e6) => Math.max(0, Math.min(max, Math.floor(Number(v)) || 0));
const objeto = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const conTrato = (k) => tieneTrato(k);
export function sanearGenteCampo(v, hoy = 1e6) {
  const base = genteCampoNueva();
  if (!objeto(v)) return base;
  const dia = Math.max(1, entero(hoy, 1e6));
  const mapa = (o, f) => { const r = {}; if (objeto(o)) for (const [k, x] of Object.entries(o)) { if (!conTrato(k)) continue; const y = f(x); if (y !== null) r[k] = y; } return r; };
  const compras = {};
  if (objeto(v.tienda) && objeto(v.tienda.compras)) for (const [k, n] of Object.entries(v.tienda.compras)) { if (typeof k === 'string' && k.length <= 40 && conTrato(k.split('|')[0]) && entero(n, 20) > 0) compras[k] = entero(n, 20); }
  return {
    tablon: sanearTablon(v.tablon, dia),
    pedidos: mapa(v.pedidos, (x) => (Number.isFinite(Number(x)) ? entero(x) : null)),
    entregados: entero(v.entregados),
    tienda: { dia: Math.min(dia, entero(objeto(v.tienda) ? v.tienda.dia : 0)), compras },
    historias: mapa(v.historias, (x) => Math.min(entero(x, 10), 10)),
    datos: entero(v.datos, 1e4),
    conocidos: mapa(v.conocidos, (x) => Math.min(dia, entero(x)) || null),
  };
}
export const genteCampoDe = (p) => { if (!objeto(p.genteCampo)) p.genteCampo = genteCampoNueva(); return p.genteCampo; };
export const cuantoCampo = (n, k) => cuantoDe(n, k);
