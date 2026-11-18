// 4.31.0 (A): Hojarasca detallista, adentro. El refugio y tus casas se tocan: la lámpara, el farol de la puerta, las velas y el hogar se
// prenden y se apagan (con la luz que ya había: ni una luz nueva); la bomba de agua da su chorro; las ventanas se abren (entra el ruido de
// afuera) y las cortinas se corren (cambia la luz de adentro y la ventana que se ve desde afuera de noche); el baúl, la alacena y el cajón
// de la mesa se abren y tienen cosas; la radio a pilas se prende bajito; la pava silba y se ceba un mate; la silla de la mesa y el sillón
// junto al hogar te sientan; el libro y las cartas se leen; el reloj de pared marca la hora del juego y suena a la hora en punto. En tus
// casas armadas, los muebles que sirven para algo también: el sillón y la mecedora te sientan, el baúl, el ropero y el aparador se abren,
// el librero tiene libros y la canilla de la mesada y el barril dan agua.
//
// Todo con la E de siempre (una entrada de interacciones.js, `casa`) y gana lo que mirás de frente y más cerca. Reglas puras (sin three ni
// DOM): los lugares, los textos, cómo se guarda y cuánta luz da cada cosa. Lo que se ve está en casa-detalles-mundo.js y el enganche con el
// juego en casa-detalles-juego.js.

// Tiempos (segundos de juego) y alcances (metros).
export const CASA = {
  pavaHierve: 22,      // desde que la ponés al fuego hasta que silba
  mateDura: 150,       // con el agua caliente, se ceba más de uno
  chorro: 2.6,         // lo que dura el chorro de la bomba o la canilla
  alcance: 2.2,        // hasta dónde llega la mano (desde los ojos: lo bajo, como el fuego, queda lejos de la cabeza)
  cercaRefugio: 11,    // desde acá se buscan las cosas del refugio
  oyeReloj: 14,        // a esta distancia se oyen las campanadas
};

// Lo que se guarda (`progreso.casa`). De fábrica, el refugio como estaba: la lámpara y el farol prendidos (de noche la ventana y el farol
// se veían encendidos), el hogar prendido (de su chimenea sale el humo de siempre), cortinas abiertas y ventanas cerradas.
export function casaNueva() {
  return { lampara: true, farol: true, velas: false, hogar: true, radio: false, ventanas: [0, 0], cortinas: [0, 0], baul: false, alacena: false, cajon: false, libro: 0, carta: 0 };
}
const SI_NO = ['lampara', 'farol', 'velas', 'hogar', 'radio', 'baul', 'alacena', 'cajon'];
// Una partida vieja no trae `casa`: sale la de fábrica. Un guardado roto, saneado: sólo lo que existe, con su tipo.
export function sanearCasa(v) {
  const n = casaNueva();
  if (!v || typeof v !== 'object' || Array.isArray(v)) return n;
  for (const k of SI_NO) if (typeof v[k] === 'boolean') n[k] = v[k];
  for (const k of ['ventanas', 'cortinas']) if (Array.isArray(v[k])) n[k] = [0, 1].map((i) => (v[k][i] === 1 || v[k][i] === true ? 1 : 0));
  for (const k of ['libro', 'carta']) { const x = Math.floor(Number(v[k])); n[k] = Number.isFinite(x) ? Math.max(0, Math.min(999, x)) : 0; }
  return n;
}

// Cuánta luz da lo prendido, con las luces que ya tenía el refugio (`encendido`: 0 de día, 1 de noche):
//   · `luz`: la luz cálida de adentro (antes `encendido * 4`); de día, con el hogar prendido, el fuego también alumbra un poco;
//   · `ventana`: lo que brilla el vidrio visto desde afuera (antes `encendido`); con las cortinas corridas, menos;
//   · `relleno`: la luz del día que entra por las ventanas (factor sobre la de antes): con las cortinas corridas, menos;
//   · `farol`: el farol de la puerta (factor).
export function brillosCasa(e, encendido) {
  const c = e || casaNueva();
  const enc = Math.max(0, Math.min(1, Number(encendido) || 0));
  const fuentes = (c.lampara ? 1 : 0) + (c.hogar ? 0.5 : 0) + (c.velas ? 0.3 : 0);
  const cerradas = (c.cortinas?.[0] ? 1 : 0) + (c.cortinas?.[1] ? 1 : 0);
  return {
    luz: enc * 4 * Math.min(1.2, fuentes) + (c.hogar ? 0.9 : 0) * (1 - enc),
    ventana: enc * Math.min(1, Math.max(0.06, fuentes)) * (1 - 0.32 * cerradas),
    relleno: 1 - 0.22 * cerradas,
    farol: c.farol ? 1 : 0,
  };
}

// Las cosas del refugio, en su marco (x a lo ancho, +z sale por la puerta, el piso adentro a 0,37 m; ver estructuras.js): `en` son los
// puntos que se miran (uno alcanza; las cortinas, en los costados de la ventana), `r` cuánto se puede errar al mirar, `afuera` si se usa desde
// afuera (el farol y la bomba).
export const PISO_REFUGIO = 0.37;
export const COSAS_REFUGIO = [
  { id: 'lampara', en: [[0.95, 1.08, -1.3]], r: 0.2 },
  { id: 'velas', en: [[-2.4, 1.72, -2.05]], r: 0.5 },
  { id: 'hogar', en: [[-2.4, 0.72, -1.78]], r: 0.45 },
  { id: 'pava', en: [[-2.02, 0.72, -1.72]], r: 0.2 },
  { id: 'silla', en: [[1.1, 0.85, -0.02]], r: 0.3, sentarse: { x: 1.1, z: 0.0, y: 0.86, mira: [0, -1] } },
  { id: 'sillon', en: [[-1.45, 0.8, -0.95]], r: 0.38, sentarse: { x: -1.45, z: -0.95, y: 0.84, mira: [-0.7, -0.72] } },
  { id: 'cajon', en: [[1.1, 0.75, -0.5]], r: 0.2 },
  { id: 'alacena', en: [[0.55, 1.0, -2.15]], r: 0.38 },
  { id: 'radio', en: [[0.42, 1.64, -2.36]], r: 0.2 },
  { id: 'cartas', en: [[0.8, 1.55, -2.3]], r: 0.12 },
  { id: 'baul', en: [[3.05, 0.88, -0.55]], r: 0.4 },
  { id: 'libro', en: [[1.95, 0.84, -1.78]], r: 0.15 },
  { id: 'reloj', en: [[1.12, 1.8, 2.5]], r: 0.24 },
  { id: 'ventana-0', en: [[2.2, 1.45, 2.6]], r: 0.4, ventana: 0 },
  { id: 'cortina-0', en: [[1.52, 1.5, 2.55], [2.88, 1.5, 2.55]], r: 0.2, cortina: 0 },
  { id: 'ventana-1', en: [[-3.35, 1.45, 0]], r: 0.4, ventana: 1 },
  { id: 'cortina-1', en: [[-3.3, 1.5, -0.68], [-3.3, 1.5, 0.68]], r: 0.2, cortina: 1 },
  { id: 'farol', en: [[-1.15, 2.05, 2.93]], r: 0.25, afuera: true },
  { id: 'bomba', en: [[4.15, 0.95, 1.2]], r: 0.35, afuera: true },
];

// Lo que dice el aviso para cada cosa del refugio. `e`: la casa guardada; `x`: lo que no se guarda (la pava, el chorro).
export function avisoCosa(id, e, x = {}) {
  switch (id) {
    case 'lampara': return e.lampara ? 'Apagar la lámpara' : 'Prender la lámpara';
    case 'farol': return e.farol ? 'Apagar el farol de la puerta' : 'Prender el farol de la puerta';
    case 'velas': return e.velas ? 'Apagar las velas' : 'Prender las velas';
    case 'hogar': return e.hogar ? 'Apagar el hogar' : 'Prender el hogar';
    case 'pava': return x.pava === 'silba' ? 'Sacar la pava y cebar un mate' : x.pava === 'lista' ? 'Cebarte otro mate' : x.pava === 'calienta' ? 'La pava se está calentando' : 'Poner la pava al fuego';
    case 'silla': return 'Sentarte a la mesa';
    case 'sillon': return 'Sentarte en el sillón junto al hogar';
    case 'cajon': return e.cajon ? 'Cerrar el cajón de la mesa' : 'Abrir el cajón de la mesa';
    case 'alacena': return e.alacena ? 'Cerrar la alacena' : 'Abrir la alacena';
    case 'radio': return e.radio ? 'Apagar la radio' : 'Prender la radio';
    case 'cartas': return 'Leer las cartas';
    case 'baul': return e.baul ? 'Cerrar el baúl' : 'Abrir el baúl';
    case 'libro': return 'Leer el libro';
    case 'reloj': return 'Mirar el reloj de pared';
    case 'bomba': return x.chorro > 0 ? 'Sale agua de la bomba' : 'Bombear agua';
    default: {
      const v = /^ventana-(\d)$/.exec(id), c = /^cortina-(\d)$/.exec(id);
      if (v) return e.ventanas[+v[1]] ? 'Cerrar la ventana' : 'Abrir la ventana';
      if (c) return e.cortinas[+c[1]] ? 'Abrir la cortina' : 'Correr la cortina';
      return null;
    }
  }
}

// ¿Esta cosa se puede usar ahora? (la ventana, con la cortina corrida, no: primero se abre la cortina; con la cortina corrida, el medio de
// la ventana también es la cortina)
export function cosaDisponible(cosa, e) {
  if (cosa.ventana !== undefined) return !e.cortinas[cosa.ventana];
  return true;
}
export function puntosDeCosa(cosa, e) {
  if (cosa.cortina !== undefined && e.cortinas[cosa.cortina]) {
    const v = COSAS_REFUGIO.find((k) => k.ventana === cosa.cortina);
    return v ? [...cosa.en, ...v.en] : cosa.en;
  }
  return cosa.en;
}

// A qué apuntás: de los candidatos `{ p: { x, y, z }, r }`, el que tenés de frente (el rayo de los ojos pasa a menos de `r` del punto), a
// mano (`alcance`) y más cerca. `ojo` y `dir` (normalizado), en el mundo. Devuelve el índice o -1.
export function elegirMirado(candidatos, ojo, dir, alcance = CASA.alcance) {
  let mejor = -1, puntaje = -Infinity;
  for (let i = 0; i < candidatos.length; i++) {
    const { p, r } = candidatos[i];
    const dx = p.x - ojo.x, dy = p.y - ojo.y, dz = p.z - ojo.z;
    const d = Math.hypot(dx, dy, dz);
    if (d > alcance + r * 0.5 || d < 1e-6) continue;
    const a = (dx * dir.x + dy * dir.y + dz * dir.z);   // lo que avanza el rayo hasta el punto
    if (a <= 0) continue;
    const lejos = Math.sqrt(Math.max(0, d * d - a * a));   // lo que pasa el rayo del punto
    if (lejos > r) continue;
    const s = -lejos / r - d * 0.15;
    if (s > puntaje) { puntaje = s; mejor = i; }
  }
  return mejor;
}

// La pava: fría → calienta (al fuego, con el hogar prendido) → silba (a los `pavaHierve` s) → lista (ya se cebó uno; se ceba otro hasta
// `mateDura` s) → fría. Con el hogar apagado, se enfría. `p`: { estado, t }.
export function pavaNueva() { return { estado: 'fria', t: 0 }; }
export function avanzarPava(p, dt, hogar) {
  if (p.estado === 'fria') return p;
  p.t += dt;
  if (p.estado === 'calienta') { if (!hogar) { p.estado = 'fria'; p.t = 0; } else if (p.t >= CASA.pavaHierve) { p.estado = 'silba'; p.t = 0; } }
  else if ((p.estado === 'silba' || p.estado === 'lista') && p.t >= CASA.mateDura) { p.estado = 'fria'; p.t = 0; }
  return p;
}

// Las campanadas del reloj: de la hora `antes` a la hora `ahora` (las del juego, 0..24), ¿pasó una hora en punto? Cuántas (de 1 a 12).
// Con un salto grande (dormir, la siesta) no suena: el reloj no da todas las horas que dormiste.
export function campanadas(antes, ahora) {
  if (!Number.isFinite(antes) || !Number.isFinite(ahora)) return 0;
  let d = ahora - antes;
  if (d < 0) d += 24;
  if (d <= 0 || d > 0.5) return 0;
  const h = Math.floor(ahora);
  if (Math.floor(antes) === h && antes <= ahora) return 0;
  return (h % 12) || 12;
}

// Lo que hay adentro (el cajón, el baúl): siempre lo mismo, como en una casa de verdad.
export const CAJON = 'Una caja de fósforos, un cortaplumas, hilo y aguja, dos velas de repuesto y el lápiz que se le perdió al cuaderno.';
export const BAUL = 'Una frazada de lana doblada, un sombrero de ala ancha, un par de alpargatas, un mapa viejo del valle y una lata con botones.';
// La alacena: la yerba y el azúcar de siempre, y lo tuyo que tengas guardado (`despensa`: nombres).
export function textoAlacena(despensa = []) {
  const tuyo = despensa.filter(Boolean).slice(0, 4);
  return tuyo.length ? `Yerba, azúcar, harina y, en el estante de arriba, lo tuyo: ${tuyo.join(', ')}.` : 'Yerba, azúcar, harina, un frasco de sal gruesa y unas galletas. Tus conservas, cuando las tengas, van acá.';
}

// El libro de la mesa de luz: un capítulo cada vez que lo leés (vuelve a empezar).
export const LIBRO = {
  titulo: 'Cuaderno de un baqueano',
  capitulos: [
    ['Capítulo uno. El valle se mira de arriba antes de bajar: donde el bosque es más oscuro, ahí corre el agua.', 'El que apura la bajada llega cansado y no ve nada.'],
    ['Capítulo dos. La lenga se pone colorada antes que nadie en otoño; el coihue no: el coihue no cambia de opinión.', 'Por eso a la sombra del coihue se duerme tranquilo.'],
    ['Capítulo tres. El viento del oeste trae lluvia; el del sur, frío limpio. El del norte trae visitas.', 'Conviene tener yerba para los tres.'],
    ['Capítulo cuatro. El fuego se prende de abajo para arriba y se apaga de arriba para abajo.', 'Quien deja brasas en la ceniza, a la mañana tiene fuego sin fósforos.'],
    ['Capítulo cinco. Al caballo se le habla antes de pedirle nada. Al perro, después.', 'A la gente, depende del día.'],
    ['Capítulo seis. Una casa no es las paredes: es la pava caliente y alguien que pregunta cómo te fue.', 'Fin del cuaderno. En la última hoja alguien dibujó una montaña con lápiz.'],
  ],
};
// Las cartas atadas con un piolín, sobre la alacena: de gente de lejos (inventada, como la de la radio).
export const CARTAS = [
  ['Una postal del lago de allá abajo:', '«Acá llovió toda la semana y el lago subió hasta el muelle. Si pasás por el pueblo, avisá. Marta.»'],
  ['Una carta escrita con lápiz:', '«Te mando semillas de arvejilla para la huerta. Se siembran cuando deja de helar. Un abrazo grande, Alcira.»'],
  ['Una carta con una foto vieja adentro:', '«Encontré esta foto del refugio cuando tenía el techo de paja. Quedátela, allá está mejor. Rodolfo.»'],
  ['Una tarjeta de cumpleaños:', '«Que cumplas muchos más en ese valle tan lindo. No te olvides de escribir. Tu tía Nilda.»'],
];

// Tus muebles armados que se usan con la E (los ids de planos-muebles*.js, planos-lujo*.js y planos-cocina.js): qué se hace y dónde se
// mira, en el marco del mueble (frente a -z). `sentarse`: el asiento (alto y hacia dónde mira); `agua`: de dónde cae el chorro y hasta dónde.
export const MUEBLES_CASA = {
  sillon: { que: 'sentarse', nombre: 'el sillón', en: [0, 0.6, 0], r: 0.5, asiento: 0.5 },
  mecedora: { que: 'sentarse', nombre: 'la mecedora', en: [0, 0.6, 0], r: 0.45, asiento: 0.48 },
  'sillon-cuero': { que: 'sentarse', nombre: 'el sillón de cuero', en: [0, 0.6, 0], r: 0.48, asiento: 0.5 },
  baul: { que: 'abrir', nombre: 'el baúl', en: [0, 0.55, 0], r: 0.45, adentro: BAUL },
  ropero: { que: 'abrir', nombre: 'el ropero', en: [0, 1.1, -0.3], r: 0.55, adentro: 'Tu ropa colgada, un poncho de invierno, dos camisas planchadas y, abajo, las botas de lluvia.' },
  aparador: { que: 'abrir', nombre: 'el aparador', en: [0, 0.9, -0.25], r: 0.6, adentro: 'Los platos hondos, las tazas de loza, un mantel bordado y la cuchara de servir que no usa nadie.' },
  alacena: { que: 'abrir', nombre: 'la alacena', en: [0, 1.0, -0.2], r: 0.5, adentro: null },
  'armario-tallado': { que: 'abrir', nombre: 'el armario', en: [0, 1.1, -0.3], r: 0.6, adentro: 'Las sábanas de hilo, las frazadas de lana y una caja de lata con fotos de casamientos ajenos.' },
  'mesa-luz': { que: 'abrir', nombre: 'el cajón de la mesa de luz', en: [0, 0.6, -0.2], r: 0.3, adentro: 'Un libro con la esquina doblada, una vela, los fósforos y unos anteojos que no son tuyos.' },
  escritorio: { que: 'abrir', nombre: 'el cajón del escritorio', en: [0, 0.7, -0.3], r: 0.45, adentro: 'Papel de carta, sobres, un tintero casi seco, estampillas viejas y una lupa.' },
  librero: { que: 'leer', nombre: 'el librero', en: [0, 1.2, -0.15], r: 0.55 },
  'estanteria-roble': { que: 'leer', nombre: 'la estantería', en: [0, 1.2, -0.2], r: 0.6 },
  mesada: { que: 'agua', nombre: 'la canilla', en: [-0.35, 1.0, 0], r: 0.6, pico: [-0.5, 1.19, 0.01], hasta: 0.89 },
  'barril-agua': { que: 'agua', nombre: 'el barril', en: [0, 0.55, -0.2], r: 0.4, pico: [0, 0.29, -0.39], hasta: 0.02 },
};
export function avisoMueble(id, abierto = false) {
  const m = MUEBLES_CASA[id];
  if (!m) return null;
  if (m.que === 'sentarse') return `Sentarte en ${m.nombre}`;
  if (m.que === 'abrir') return id === 'mesa-luz' || id === 'escritorio' ? `Abrir ${m.nombre}` : `${abierto ? 'Mirar' : 'Abrir'} ${m.nombre}`;
  if (m.que === 'leer') return 'Sacar un libro y leer';
  if (m.que === 'agua') return id === 'mesada' ? 'Abrir la canilla' : 'Sacar agua del barril';
  return null;
}
// La vista hacia donde mira el asiento (el frente del mueble, -z de su marco) como `yaw` del jugador (el adelante del jugador es (-sen, -cos)).
export function yawHacia(rot, lx, lz) {
  const c = Math.cos(rot), s = Math.sin(rot);
  const wx = lx * c + lz * s, wz = -lx * s + lz * c;
  return Math.atan2(-wx, -wz);
}
